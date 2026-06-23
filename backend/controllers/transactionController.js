const axios       = require('axios');
const formData    = require('form-data');
const User        = require('../models/User');
const Wallet      = require('../models/Wallet');
const Transaction  = require('../models/Transaction');
const BankAccount  = require('../models/BankAccount');
const Notification = require('../models/Notification');

const PALM_AUTH_URL = process.env.PALM_AUTH_URL || 'http://localhost:8000';

// ─── Utility: call the palm-auth microservice ─────────────────────────────────
async function verifyPalmBiometric(clerkId, fileBuffer) {
    const form = new formData();
    form.append('file', fileBuffer, { filename: 'verify.jpg' });
    const resp = await axios.post(`${PALM_AUTH_URL}/verify/${clerkId}`, form, {
        headers: form.getHeaders(),
    });
    return resp.data;
}

// ─── GET /api/transactions/:clerkId ─────────────────────────────────────────
exports.getTransactions = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const transactions = await Transaction.find({ userId: clerkId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── POST /api/transactions/create ──────────────────────────────────────────
exports.createTransaction = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { clerkId, recipientId, bankId, recipient, amount, category, description } = req.body;

        if (!req.file) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Palm authentication required' });
        }

        const palmResp = await verifyPalmBiometric(clerkId, req.file.buffer);
        if (!palmResp.accepted) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Palm authentication failed' });
        }

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
                sender: 'My Wallet',
                recipient: bank.bankName,
                amount: -amtNum,
                category: 'Bank Transfer',
                type: 'transfer',
                paymentMethod: { type: 'bank', id: bankId },
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
            });

            // Credit recipient if on-platform
            if (recipientWallet) {
                recipientWallet.balance += amtNum;
                await recipientWallet.save({ session });

                const txIn = new Transaction({
                    userId: recipientId,
                    sender: senderUser.name || 'External Sender',
                    recipient: recipientUser?.name || 'Me',
                    amount: amtNum,
                    category: category || 'Transfer',
                    type: 'credit',
                    paymentMethod: { type: 'wallet' },
                    description: `Received from ${senderUser.name || 'User'}`,
                });
                await txIn.save({ session });
            }
        }

        await txOut.save({ session });

        // Finalize transaction
        await session.commitTransaction();
        session.endSession();

        // System Post-Journaling (Create notifications asynchronously outside transaction for speed)
        try {
            // Notification for Sender
            await new Notification({
                userId: clerkId,
                title: 'Payment Sent',
                message: `You successfully sent Rs. ${amtNum.toLocaleString()} to ${recipient || recipientUser?.name || 'External Account'}.`,
                type: 'transaction'
            }).save();

            // Notification for Receiver
            if (recipientWallet) {
                await new Notification({
                    userId: recipientId,
                    title: 'Funds Received',
                    message: `You received Rs. ${amtNum.toLocaleString()} from ${senderUser.name || 'User'}.`,
                    type: 'transaction'
                }).save();
            }
        } catch (notifErr) {
            console.error('Async Notification Error:', notifErr);
        }

        res.json({ 
            message: 'Transaction successful', 
            transaction: txOut, 
            balance: senderWallet.balance 
        });

    } catch (err) {
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
exports.addFunds = async (req, res) => {
    try {
        const { clerkId, bankId, amount, source } = req.body;

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
            recipient: user.name || 'My Wallet',
            amount: amtNum,
            category: 'Deposit',
            type: 'deposit',
            paymentMethod: { type: 'bank', id: bankId },
            description: `Deposit from ${source || 'external bank'}`,
        });
        wallet.balance += amtNum;
        await Promise.all([wallet.save(), tx.save()]);

        // Journal the deposit
        try {
            await new Notification({
                userId: clerkId,
                title: 'Funds Added',
                message: `Rs. ${amtNum.toLocaleString()} successfully added to your wallet from ${source || 'External Source'}.`,
                type: 'transaction'
            }).save();
        } catch (notifErr) {
            console.error('Deposit Notification Error:', notifErr);
        }

        const banks = await BankAccount.find({ userId: clerkId });

        res.json({
            message: 'Funds added successfully',
            transaction: tx,
            balance: wallet.balance,
            linkedBanks: banks.map(b => ({
                id:      b._id,
                bankId:  b._id,
                name:    b.bankName,
                last4:   b.accountNumberMasked.split(' ').pop(),
                balance: b.balance,
            })),
        });
    } catch (err) {
        console.error('addFunds error:', err);
        res.status(500).json({ error: 'Deposit failed' });
    }
};
