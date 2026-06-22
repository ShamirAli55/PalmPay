const Wallet      = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card        = require('../models/Card');

// ─── GET /api/wallet/:clerkId ────────────────────────────────────────────────
exports.getWallet = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const wallet = await Wallet.findOne({ userId: clerkId });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        res.json(wallet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── GET /api/wallet/:clerkId/banks ──────────────────────────────────────────
exports.getBanks = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const banks = await BankAccount.find({ userId: clerkId });
        res.json(banks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── POST /api/wallet/:clerkId/banks ─────────────────────────────────────────
exports.addBank = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const { bankName, accountNumberMasked, accountHolderName, accountType } = req.body;
        const bank = new BankAccount({ userId: clerkId, bankName, accountNumberMasked, accountHolderName, accountType });
        await bank.save();
        res.status(201).json(bank);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── DELETE /api/wallet/banks/:bankId ────────────────────────────────────────
exports.removeBank = async (req, res) => {
    try {
        await BankAccount.findByIdAndDelete(req.params.bankId);
        res.json({ message: 'Bank account removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── GET /api/wallet/:clerkId/cards ──────────────────────────────────────────
exports.getCards = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const cards = await Card.find({ userId: clerkId });
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── PATCH /api/wallet/cards/:cardId/freeze ───────────────────────────────────
exports.freezeCard = async (req, res) => {
    try {
        const card = await Card.findById(req.params.cardId);
        if (!card) return res.status(404).json({ message: 'Card not found' });
        card.status = card.status === 'frozen' ? 'active' : 'frozen';
        await card.save();
        res.json({ message: `Card ${card.status}`, card });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── PATCH /api/wallet/cards/:cardId/settings ────────────────────────────────
exports.updateCardSettings = async (req, res) => {
    try {
        const card = await Card.findByIdAndUpdate(
            req.params.cardId,
            { $set: { settings: req.body } },
            { new: true }
        );
        if (!card) return res.status(404).json({ message: 'Card not found' });
        res.json(card);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
