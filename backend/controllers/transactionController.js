const axios       = require('axios');
const formData    = require('form-data');
const User        = require('../models/User');
const Wallet      = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const BankAccount = require('../models/BankAccount');

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
    try {
        const { clerkId, recipientId, recipient, amount, category, description } = req.body;

        if (!req.file) return res.status(400).json({ message: 'Palm authentication required' });

        const palmResp = await verifyPalmBiometric(clerkId, req.file.buffer);
        if (!palmResp.accepted) {
            return res.status(401).json({ message: 'Palm authentication failed', similarity: palmResp.similarity });
        }

        const [user, wallet] = await Promise.all([
            User.findOne({ clerkId }),
            Wallet.findOne({ userId: clerkId }),
        ]);
        if (!user || !wallet) return res.status(404).json({ message: 'User or Wallet not found' });
        if (wallet.balance < parseFloat(amount)) return res.status(400).json({ message: 'Insufficient balance' });

        const [recipientUser, recipientWallet] = await Promise.all([
            User.findOne({ clerkId: recipientId }),
            Wallet.findOne({ userId: recipientId }),
        ]);

        // Debit sender
        const amtNum = Math.abs(parseFloat(amount));
        const txOut = new Transaction({
            userId: clerkId,
            sender: user.name || 'Me',
            recipient: recipient || recipientUser?.name || 'Unknown',
            amount: -amtNum,
            category: category || 'Transfer',
            type: 'transfer',
            paymentMethod: { type: 'wallet' },
            description,
        });
        wallet.balance -= amtNum;
        await Promise.all([wallet.save(), txOut.save()]);

        // Credit recipient if on-platform
        if (recipientWallet) {
            const txIn = new Transaction({
                userId: recipientId,
                sender: user.name || 'Me',
                recipient: recipientUser?.name || 'User',
                amount: amtNum,
                category: category || 'Transfer',
                type: 'credit',
                paymentMethod: { type: 'wallet' },
                description: `Received from ${user.name}`,
            });
            recipientWallet.balance += amtNum;
            await Promise.all([recipientWallet.save(), txIn.save()]);
        }

        res.json({ message: 'Transaction successful', transaction: txOut, balance: wallet.balance });
    } catch (err) {
        console.error('createTransaction error:', err);
        res.status(500).json({ error: 'Transaction failed' });
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
