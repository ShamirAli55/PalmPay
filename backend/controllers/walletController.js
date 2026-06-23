const Wallet      = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card        = require('../models/Card');
const Notification = require('../models/Notification');

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

        // Notification for bank link
        try {
            await new Notification({
                userId: clerkId,
                title: 'Bank Linked',
                message: `You successfully linked your ${bankName} account (xxxx-${accountNumberMasked.slice(-4)}).`,
                type: 'system'
            }).save();
        } catch (notifErr) {
            console.error('Bank notification error:', notifErr);
        }

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

        // Notification for card security change
        try {
            await new Notification({
                userId: card.userId, // Card model needs userId
                title: card.status === 'frozen' ? 'Card Frozen' : 'Card Activated',
                message: `Your ${card.network || 'Visa'} card (xxxx-${card.cardNumber.slice(-4)}) has been ${card.status}.`,
                type: 'security'
            }).save();
        } catch (notifErr) {
            console.error('Card notification error:', notifErr);
        }

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

// ─── POST /api/wallet/cards/issue ─────────────────────────────────────────────
exports.issueCard = async (req, res) => {
    try {
        const { clerkId, label, brand, color } = req.body;
        const wallet = await Wallet.findOne({ userId: clerkId });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

        const last4 = Math.floor(1000 + Math.random() * 9000).toString();
        const card = new Card({
            userId: clerkId,
            walletId: wallet._id,
            cardType: 'Virtual',
            brand: brand || 'VISA',
            label: label || 'NEW VIRTUAL CARD',
            last4: last4,
            expiry: '12/28',
            status: 'active',
            color: color || 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
        });

        await card.save();

        try {
            await new Notification({
                userId: clerkId,
                title: 'New Card Issued',
                message: `Your new ${brand} virtual card (${label}) is now active.`,
                type: 'system'
            }).save();
        } catch (nErr) {}

        res.status(201).json(card);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
