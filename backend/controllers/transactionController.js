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
<<<<<<< HEAD
const { validateAmount, validateClerkId, validateObjectId, sanitizeText } = require('../utils/validators');
=======
>>>>>>> origin/main

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
<<<<<<< HEAD
        timeout: 15000, // Prevent hanging requests
=======
>>>>>>> origin/main
    });
    return resp.data;
}

// ─── GET /api/transactions/:clerkId ─────────────────────────────────────────
exports.getTransactions = async (req, res) => {
    try {
        const { clerkId } = req.params;
<<<<<<< HEAD

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
=======
        const transactions = await Transaction.find({ userId: clerkId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
>>>>>>> origin/main
    }
};

// ─── POST /api/transactions/create ──────────────────────────────────────────
exports.createTransaction = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { clerkId, recipientId, bankId, recipient, amount, category, description } = req.body;

<<<<<<< HEAD
        // ── 1. Validate palm image ─────────────────────────────────────────
=======
>>>>>>> origin/main
        if (!req.file) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Palm authentication required' });
        }

<<<<<<< HEAD
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
=======
        const palmResp = await verifyPalmBiometric(clerkId, req.file.buffer);
        if (!palmResp.accepted) {
>>>>>>> origin/main
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Palm authentication failed' });
        }

<<<<<<< HEAD
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
=======
        const amtNum = Math.abs(parseFloat(amount));

        // Use session in all finds/saves
        const senderWallet = await Wallet.findOne({ userId: clerkId }).session(session);
        const senderUser = await User.findOne({ clerkId }).session(session);

        if (!senderWallet || !senderUser) throw new Error('Sender wallet or user not found');
        if (senderWallet.balance < amtNum) throw new Error('Insufficient balance');

        // Deduct from sender
        senderWallet.balance -= amtNum;
        await senderWallet.save({ session });

        let txOut;

        if (bankId) {
            // TRANSFER TO BANK (WITHDRAWAL)
            const bank = await BankAccount.findById(bankId).session(session);
            if (!bank) throw new Error('Target bank account not found');

            bank.balance += amtNum;
            await bank.save({ session });

            txOut = new Transaction({
                userId: clerkId,
>>>>>>> origin/main
                sender: 'My Wallet',
                recipient: bank.bankName,
                amount: -amtNum,
                category: 'Bank Transfer',
                type: 'transfer',
                paymentMethod: { type: 'bank', id: bankId },
<<<<<<< HEAD
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
=======
                description: description || `Transfer to ${bank.bankName}`,
            });
        } else {
            // P2P TRANSFER
            const recipientWallet = await Wallet.findOne({ userId: recipientId }).session(session);
            const recipientUser = await User.findOne({ clerkId: recipientId }).session(session);

            txOut = new Transaction({
                userId: clerkId,
                sender: senderUser.name || 'Me',
                recipient: recipient || recipientUser?.name || 'External Recipient',
                amount: -amtNum,
                category: category || 'Transfer',
                type: 'transfer',
                paymentMethod: { type: 'wallet' },
                description,
>>>>>>> origin/main
            });

            // Credit recipient if on-platform
            if (recipientWallet) {
<<<<<<< HEAD
                recipientWallet.balance = Math.round((recipientWallet.balance + amtNum) * 100) / 100;
=======
                recipientWallet.balance += amtNum;
>>>>>>> origin/main
                await recipientWallet.save({ session });

                const txIn = new Transaction({
                    userId: recipientId,
                    sender: senderUser.name || 'External Sender',
                    recipient: recipientUser?.name || 'Me',
                    amount: amtNum,
<<<<<<< HEAD
                    category: sanitizeText(category, 50) || 'Transfer',
=======
                    category: category || 'Transfer',
>>>>>>> origin/main
                    type: 'credit',
                    paymentMethod: { type: 'wallet' },
                    description: `Received from ${senderUser.name || 'User'}`,
                });
                await txIn.save({ session });
            }
        }

        await txOut.save({ session });

<<<<<<< HEAD
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

=======
        // Finalize transaction
        await session.commitTransaction();
        session.endSession();

        // System Post-Journaling (Create notifications asynchronously outside transaction for speed)
        try {
            // Notification for Sender
            const notifSender = await new Notification({
                userId: clerkId,
                title: 'Payment Sent',
                message: `Rs. ${amtNum.toLocaleString()} sent to ${recipient || recipientUser?.name || 'Recipient'}.`,
                type: 'transaction'
            }).save();

            emitWalletBalanceUpdated({ clerkId, wallet: senderWallet, reason: 'SEND', transactionId: txOut._id });
            emitTransactionCreated({ clerkId, transaction: txOut });
            emitNotificationNew({ clerkId, notification: notifSender });
            getUnreadCount(clerkId).then(count => emitUnreadCountUpdated({ clerkId, unreadCount: count }));

            // Notification for Receiver
>>>>>>> origin/main
            if (recipientWallet) {
                const notifReceiver = await new Notification({
                    userId: recipientId,
                    title: 'Funds Received',
                    message: `Rs. ${amtNum.toLocaleString()} received from ${senderUser.name || 'User'}.`,
                    type: 'transaction'
                }).save();

                emitWalletBalanceUpdated({ clerkId: recipientId, wallet: recipientWallet, reason: 'RECEIVE', transactionId: txOut._id });
<<<<<<< HEAD
                const txIn = await Transaction.findOne({ userId: recipientId }).sort({ _id: -1 });
=======
                // We need the transaction view for the receiver too
                // For receiver, the transaction object should be their view (credit)
                const txIn = await Transaction.findOne({ userId: recipientId, reference: txOut.reference });
>>>>>>> origin/main
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
<<<<<<< HEAD
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
=======
        console.error('createTransaction transaction failed, rolling back:', err);
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({
            error: 'Transaction failed',
            message: err.message === 'Insufficient balance' ? 'Insufficient balance' : 'Security or connection error'
        });
    }
};

// ─── POST /api/wallet/add-funds ──────────────────────────────────────────────
>>>>>>> origin/main
exports.addFunds = async (req, res) => {
    try {
        const { clerkId, bankId, amount, source } = req.body;

<<<<<<< HEAD
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
=======
        if (!req.file) return res.status(400).json({ message: 'Palm authentication required' });

        const palmResp = await verifyPalmBiometric(clerkId, req.file.buffer);
        if (!palmResp.accepted) {
            return res.status(401).json({ message: 'Palm authentication failed' });
        }

        const [user, wallet] = await Promise.all([
            User.findOne({ clerkId }),
            Wallet.findOne({ userId: clerkId }),
        ]);
        if (!user || !wallet) return res.status(404).json({ message: 'User or Wallet not found' });

        const amtNum = Math.abs(parseFloat(amount));

        // Deduct from the source bank account
        if (bankId) {
            const bank = await BankAccount.findById(bankId);
            if (bank) {
                if (bank.balance < amtNum) {
                    return res.status(400).json({ message: `Insufficient funds in ${bank.bankName}` });
                }
                bank.balance -= amtNum;
                await bank.save();
            }
        }

        const tx = new Transaction({
            userId: clerkId,
            sender: source || 'Bank Deposit',
>>>>>>> origin/main
            recipient: user.name || 'My Wallet',
            amount: amtNum,
            category: 'Deposit',
            type: 'deposit',
            paymentMethod: { type: 'bank', id: bankId },
<<<<<<< HEAD
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
=======
            description: `Deposit from ${source || 'external bank'}`,
        });
        wallet.balance += amtNum;
        await Promise.all([wallet.save(), tx.save()]);

        // Journal the deposit
        try {
            const notif = await new Notification({
                userId: clerkId,
                title: 'Funds Added',
                message: `Rs. ${amtNum.toLocaleString()} added to wallet from ${source || 'Source'}.`,
                type: 'transaction'
            }).save();

            emitWalletBalanceUpdated({ clerkId, wallet, reason: 'DEPOSIT', transactionId: tx._id });
            emitTransactionCreated({ clerkId, transaction: tx });
            emitNotificationNew({ clerkId, notification: notif });
            getUnreadCount(clerkId).then(count => emitUnreadCountUpdated({ clerkId, unreadCount: count }));
>>>>>>> origin/main
        } catch (notifErr) {
            console.error('Deposit Notification/Realtime Error:', notifErr);
        }

<<<<<<< HEAD
        const banks = await BankAccount.find({ userId: clerkIdValidation.value });
=======
        const banks = await BankAccount.find({ userId: clerkId });
>>>>>>> origin/main

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
<<<<<<< HEAD

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
=======
        // Find unique categories for this user. 
        // We include a default set to ensure the UI has something if no transactions exist.
        const defaultCategories = ["Transfer", "Shopping", "Income", "Software", "Technology", "Salary", "Utils", "Food", "Deposit"];
        const userCategories = await Transaction.distinct('category', { userId: clerkId });
        
        // Merge and remove duplicates, filter out falsy values
        const merged = [...new Set([...defaultCategories, ...userCategories])].filter(Boolean);
        res.json(merged);
    } catch (err) {
        res.status(500).json({ error: err.message });
>>>>>>> origin/main
    }
};
