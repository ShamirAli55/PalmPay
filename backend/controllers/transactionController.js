const axios = require('axios');
const formData = require('form-data');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');
const Notification = require('../models/Notification');
const { emitWalletBalanceUpdated } = require('../realtime/emitters/walletEmitter');
const { emitTransactionCreated } = require('../realtime/emitters/transactionEmitter');
const { emitNotificationNew, emitUnreadCountUpdated } = require('../realtime/emitters/notificationEmitter');
const { validateAmount, validateClerkId, validateObjectId, sanitizeText } = require('../utils/validators');

// Unread count helper
const getUnreadCount = async (clerkId) => {
    return await Notification.countDocuments({ userId: clerkId, isRead: false });
};

const PALM_AUTH_URL = process.env.PALM_AUTH_URL || 'http://localhost:8000';

// ─── Utility: call the palm-auth microservice ─────────────────────────────────
async function verifyPalmBiometric(clerkId, fileBuffer) {
    const form = new formData();
    form.append('file', fileBuffer, { filename: 'verify.jpg' });
    const resp = await axios.post(`${PALM_AUTH_URL}/verify/${clerkId}`, form, {
        headers: form.getHeaders(),
        timeout: 15000, // Prevent hanging requests
    });
    return resp.data;
}

// ─── GET /api/transactions/:clerkId ─────────────────────────────────────────
exports.getTransactions = async (req, res) => {
    try {
        const { clerkId } = req.params;

        // Validate clerkId ownership against authenticated session
        const authId = req.auth?.sub;
        if (!authId || authId !== clerkId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!clerkId || typeof clerkId !== 'string' || clerkId.trim() === '') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const transactions = await Transaction.find({ userId: clerkId }).sort({ date: -1 }).limit(500);
        res.json(transactions);
    } catch (err) {
        console.error('getTransactions error:', err);
        res.status(500).json({ error: 'Failed to retrieve transactions' });
    }
};

// ─── POST /api/transactions/create ──────────────────────────────────────────
exports.createTransaction = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { clerkId, recipientId, bankId, recipient, amount, category, description } = req.body;

        // ── 1. Validate palm image ─────────────────────────────────────────
        if (!req.file) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Palm authentication required' });
        }

        // Reject suspicious file sizes (too small = tampered, too large = attack)
        if (req.file.size < 1000) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Invalid palm scan image' });
        }

        // ── 2. Validate clerkId ────────────────────────────────────────────
        const clerkIdValidation = validateClerkId(clerkId);
        if (!clerkIdValidation.valid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: clerkIdValidation.message });
        }

        // Enforce ownership: authenticated user must match clerkId
        const authId = req.auth?.sub;
        if (!authId || authId !== clerkIdValidation.value) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Forbidden: identity mismatch' });
        }

        // ── 3. Validate amount ─────────────────────────────────────────────
        const amountValidation = validateAmount(amount);
        if (!amountValidation.valid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: amountValidation.message });
        }
        const amtNum = amountValidation.value;

        // ── 4. Validate destination: must have either recipientId OR bankId ─
        if (!recipientId && !bankId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'A recipient or destination bank account is required' });
        }

        // ── 5. Self-transfer guard ─────────────────────────────────────────
        if (recipientId && recipientId.trim() === clerkIdValidation.value) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'You cannot send money to yourself' });
        }

        // ── 6. Validate bankId if provided ────────────────────────────────
        if (bankId) {
            const bankIdValidation = validateObjectId(bankId, 'Bank account ID');
            if (!bankIdValidation.valid) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: bankIdValidation.message });
            }
        }

        // ── 7. Palm verification ──────────────────────────────────────────
        let palmResp;
        try {
            palmResp = await verifyPalmBiometric(clerkIdValidation.value, req.file.buffer);
        } catch (palmErr) {
            console.error('Palm service error:', palmErr.message);
            await session.abortTransaction();
            session.endSession();
            return res.status(503).json({ message: 'Biometric service unavailable. Please try again.' });
        }

        if (!palmResp || !palmResp.accepted) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Palm authentication failed' });
        }

        // ── 8. Load sender resources ──────────────────────────────────────
        const senderWallet = await Wallet.findOne({ userId: clerkIdValidation.value }).session(session);
        const senderUser = await User.findOne({ clerkId: clerkIdValidation.value }).session(session);

        if (!senderWallet || !senderUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Sender account not found' });
        }

        // ── 9. Sufficient balance check (backend authoritative) ───────────
        if (senderWallet.balance < amtNum) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // ── 10. Minimum balance sanity ────────────────────────────────────
        if (amtNum < 1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Minimum transfer amount is Rs. 1' });
        }

        // ── 11. Deduct from sender ────────────────────────────────────────
        senderWallet.balance = Math.round((senderWallet.balance - amtNum) * 100) / 100;
        await senderWallet.save({ session });

        let txOut;
        let recipientWallet = null;
        let recipientUser = null;

        if (bankId) {
            // ── BANK TRANSFER (WITHDRAWAL) ────────────────────────────────
            const bank = await BankAccount.findById(bankId).session(session);
            if (!bank) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Target bank account not found' });
            }

            // Ownership: the bank account must belong to the sender
            if (bank.userId !== clerkIdValidation.value) {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({ message: 'You do not own this bank account' });
            }

            bank.balance = Math.round((bank.balance + amtNum) * 100) / 100;
            await bank.save({ session });

            txOut = new Transaction({
                userId: clerkIdValidation.value,
                sender: 'My Wallet',
                recipient: bank.bankName,
                amount: -amtNum,
                category: 'Bank Transfer',
                type: 'transfer',
                paymentMethod: { type: 'bank', id: bankId },
                description: sanitizeText(description) || `Transfer to ${bank.bankName}`,
            });
        } else {
            // ── P2P TRANSFER ──────────────────────────────────────────────
            recipientWallet = await Wallet.findOne({ userId: recipientId }).session(session);
            recipientUser = await User.findOne({ clerkId: recipientId }).session(session);

            if (!recipientUser) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Recipient not found on PalmPay' });
            }

            txOut = new Transaction({
                userId: clerkIdValidation.value,
                sender: senderUser.name || 'Me',
                recipient: sanitizeText(recipient, 100) || recipientUser?.name || 'External Recipient',
                amount: -amtNum,
                category: sanitizeText(category, 50) || 'Transfer',
                type: 'transfer',
                paymentMethod: { type: 'wallet' },
                description: sanitizeText(description),
            });

            // Credit recipient if on-platform
            if (recipientWallet) {
                recipientWallet.balance = Math.round((recipientWallet.balance + amtNum) * 100) / 100;
                await recipientWallet.save({ session });

                const txIn = new Transaction({
                    userId: recipientId,
                    sender: senderUser.name || 'External Sender',
                    recipient: recipientUser?.name || 'Me',
                    amount: amtNum,
                    category: sanitizeText(category, 50) || 'Transfer',
                    type: 'credit',
                    paymentMethod: { type: 'wallet' },
                    description: `Received from ${senderUser.name || 'User'}`,
                });
                await txIn.save({ session });
            }
        }

        await txOut.save({ session });

        // ── Commit transaction ────────────────────────────────────────────
        await session.commitTransaction();
        session.endSession();

        // ── Post-commit: notifications & realtime (non-blocking) ─────────
        try {
            const notifSender = await new Notification({
                userId: clerkIdValidation.value,
                title: 'Payment Sent',
                message: `Rs. ${amtNum.toLocaleString()} sent to ${sanitizeText(recipient, 100) || recipientUser?.name || 'Recipient'}.`,
                type: 'transaction'
            }).save();

            emitWalletBalanceUpdated({ clerkId: clerkIdValidation.value, wallet: senderWallet, reason: 'SEND', transactionId: txOut._id });
            emitTransactionCreated({ clerkId: clerkIdValidation.value, transaction: txOut });
            emitNotificationNew({ clerkId: clerkIdValidation.value, notification: notifSender });
            getUnreadCount(clerkIdValidation.value).then(count => emitUnreadCountUpdated({ clerkId: clerkIdValidation.value, unreadCount: count }));

            if (recipientWallet) {
                const notifReceiver = await new Notification({
                    userId: recipientId,
                    title: 'Funds Received',
                    message: `Rs. ${amtNum.toLocaleString()} received from ${senderUser.name || 'User'}.`,
                    type: 'transaction'
                }).save();

                emitWalletBalanceUpdated({ clerkId: recipientId, wallet: recipientWallet, reason: 'RECEIVE', transactionId: txOut._id });
                const txIn = await Transaction.findOne({ userId: recipientId }).sort({ _id: -1 });
                if (txIn) emitTransactionCreated({ clerkId: recipientId, transaction: txIn });

                emitNotificationNew({ clerkId: recipientId, notification: notifReceiver });
                getUnreadCount(recipientId).then(count => emitUnreadCountUpdated({ clerkId: recipientId, unreadCount: count }));
            }
        } catch (notifErr) {
            console.error('Async Notification/Realtime Error:', notifErr);
        }

        res.json({
            message: 'Transaction successful',
            transaction: txOut,
            balance: senderWallet.balance
        });

    } catch (err) {
        console.error('createTransaction failed, rolling back:', err);
        try {
            await session.abortTransaction();
            session.endSession();
        } catch (_) {}

        // Map known error messages to clean user-facing messages
        const msg = err.message || '';
        if (msg === 'Insufficient balance') {
            return res.status(400).json({ error: 'Transaction failed', message: 'Insufficient balance' });
        }
        res.status(500).json({ error: 'Transaction failed', message: 'Security or connection error' });
    }
};

// ─── POST /api/transactions/add-funds ────────────────────────────────────────
exports.addFunds = async (req, res) => {
    try {
        const { clerkId, bankId, amount, source } = req.body;

        // ── 1. Palm authentication ─────────────────────────────────────────
        if (!req.file) return res.status(400).json({ message: 'Palm authentication required' });

        if (req.file.size < 1000) {
            return res.status(400).json({ message: 'Invalid palm scan image' });
        }

        // ── 2. Validate clerkId ────────────────────────────────────────────
        const clerkIdValidation = validateClerkId(clerkId);
        if (!clerkIdValidation.valid) {
            return res.status(400).json({ message: clerkIdValidation.message });
        }

        // Enforce ownership
        const authId = req.auth?.sub;
        if (!authId || authId !== clerkIdValidation.value) {
            return res.status(403).json({ message: 'Forbidden: identity mismatch' });
        }

        // ── 3. Validate amount ─────────────────────────────────────────────
        const amountValidation = validateAmount(amount);
        if (!amountValidation.valid) {
            return res.status(400).json({ message: amountValidation.message });
        }
        const amtNum = amountValidation.value;

        // ── 4. Validate bankId if provided ────────────────────────────────
        if (bankId) {
            const bankIdValidation = validateObjectId(bankId, 'Bank account ID');
            if (!bankIdValidation.valid) {
                return res.status(400).json({ message: bankIdValidation.message });
            }
        }

        // ── 5. Palm verification ──────────────────────────────────────────
        let palmResp;
        try {
            palmResp = await verifyPalmBiometric(clerkIdValidation.value, req.file.buffer);
        } catch (palmErr) {
            console.error('Palm service error:', palmErr.message);
            return res.status(503).json({ message: 'Biometric service unavailable. Please try again.' });
        }

        if (!palmResp || !palmResp.accepted) {
            return res.status(401).json({ message: 'Palm authentication failed' });
        }

        // ── 6. Load resources ─────────────────────────────────────────────
        const [user, wallet] = await Promise.all([
            User.findOne({ clerkId: clerkIdValidation.value }),
            Wallet.findOne({ userId: clerkIdValidation.value }),
        ]);
        if (!user || !wallet) return res.status(404).json({ message: 'User or Wallet not found' });

        // ── 7. Bank source validation & ownership ─────────────────────────
        if (bankId) {
            const bank = await BankAccount.findById(bankId);
            if (!bank) return res.status(404).json({ message: 'Bank account not found' });

            // Ownership check
            if (bank.userId !== clerkIdValidation.value) {
                return res.status(403).json({ message: 'You do not own this bank account' });
            }

            if (bank.balance < amtNum) {
                return res.status(400).json({ message: `Insufficient funds in ${bank.bankName}` });
            }
            bank.balance = Math.round((bank.balance - amtNum) * 100) / 100;
            await bank.save();
        }

        // ── 8. Credit wallet ──────────────────────────────────────────────
        const tx = new Transaction({
            userId: clerkIdValidation.value,
            sender: sanitizeText(source, 100) || 'Bank Deposit',
            recipient: user.name || 'My Wallet',
            amount: amtNum,
            category: 'Deposit',
            type: 'deposit',
            paymentMethod: { type: 'bank', id: bankId },
            description: `Deposit from ${sanitizeText(source, 100) || 'external bank'}`,
        });
        wallet.balance = Math.round((wallet.balance + amtNum) * 100) / 100;
        await Promise.all([wallet.save(), tx.save()]);

        // ── 9. Post-commit notifications ──────────────────────────────────
        try {
            const notif = await new Notification({
                userId: clerkIdValidation.value,
                title: 'Funds Added',
                message: `Rs. ${amtNum.toLocaleString()} added to wallet from ${sanitizeText(source, 100) || 'Source'}.`,
                type: 'transaction'
            }).save();

            emitWalletBalanceUpdated({ clerkId: clerkIdValidation.value, wallet, reason: 'DEPOSIT', transactionId: tx._id });
            emitTransactionCreated({ clerkId: clerkIdValidation.value, transaction: tx });
            emitNotificationNew({ clerkId: clerkIdValidation.value, notification: notif });
            getUnreadCount(clerkIdValidation.value).then(count => emitUnreadCountUpdated({ clerkId: clerkIdValidation.value, unreadCount: count }));
        } catch (notifErr) {
            console.error('Deposit Notification/Realtime Error:', notifErr);
        }

        const banks = await BankAccount.find({ userId: clerkIdValidation.value });

        res.json({
            message: 'Funds added successfully',
            transaction: tx,
            balance: wallet.balance,
            linkedBanks: banks.map(b => ({
                id: b._id,
                bankId: b._id,
                name: b.bankName,
                last4: b.accountNumberMasked.split(' ').pop(),
                balance: b.balance,
            })),
        });
    } catch (err) {
        console.error('addFunds error:', err);
        res.status(500).json({ error: 'Deposit failed' });
    }
};

// ─── GET /api/transactions/categories/:clerkId ──────────────────────────────
exports.getCategories = async (req, res) => {
    try {
        const { clerkId } = req.params;

        if (!clerkId || typeof clerkId !== 'string' || clerkId.trim() === '') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const defaultCategories = ["Transfer", "Shopping", "Income", "Software", "Technology", "Salary", "Utils", "Food", "Deposit"];
        const userCategories = await Transaction.distinct('category', { userId: clerkId });

        const merged = [...new Set([...defaultCategories, ...userCategories])].filter(Boolean);
        res.json(merged);
    } catch (err) {
        console.error('getCategories error:', err);
        res.status(500).json({ error: 'Failed to retrieve categories' });
    }
};
