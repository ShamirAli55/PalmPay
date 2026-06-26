const Wallet      = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card        = require('../models/Card');
const Notification = require('../models/Notification');
const { validateClerkId, validateObjectId, sanitizeText } = require('../utils/validators');

// ─── GET /api/wallet/:clerkId ────────────────────────────────────────────────
exports.getWallet = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        const wallet = await Wallet.findOne({ userId: v.value });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
        res.json(wallet);
    } catch (err) {
        console.error('getWallet error:', err);
        res.status(500).json({ error: 'Failed to retrieve wallet' });
    }
};

// ─── GET /api/wallet/:clerkId/banks ──────────────────────────────────────────
exports.getBanks = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        const banks = await BankAccount.find({ userId: v.value });
        res.json(banks);
    } catch (err) {
        console.error('getBanks error:', err);
        res.status(500).json({ error: 'Failed to retrieve bank accounts' });
    }
};

// ─── POST /api/wallet/:clerkId/banks ─────────────────────────────────────────
exports.addBank = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        const { bankName, accountNumberMasked, accountHolderName, accountType } = req.body;

        // Validate required fields
        if (!bankName || typeof bankName !== 'string' || bankName.trim() === '') {
            return res.status(400).json({ message: 'Bank name is required' });
        }
        if (!accountNumberMasked || typeof accountNumberMasked !== 'string' || accountNumberMasked.trim() === '') {
            return res.status(400).json({ message: 'Account number is required' });
        }
        if (!accountHolderName || typeof accountHolderName !== 'string' || accountHolderName.trim() === '') {
            return res.status(400).json({ message: 'Account holder name is required' });
        }

        const cleanBankName = sanitizeText(bankName, 100);
        const cleanMasked = sanitizeText(accountNumberMasked, 50);
        const cleanHolder = sanitizeText(accountHolderName, 100);
        const cleanType = sanitizeText(accountType, 50) || 'Savings';

        const bank = new BankAccount({
            userId: v.value,
            bankName: cleanBankName,
            accountNumberMasked: cleanMasked,
            accountHolderName: cleanHolder,
            accountType: cleanType
        });
        await bank.save();

        // Notification for bank link
        try {
            await new Notification({
                userId: v.value,
                title: 'Bank Linked',
                message: `You successfully linked your ${cleanBankName} account (xxxx-${cleanMasked.slice(-4)}).`,
                type: 'system'
            }).save();
        } catch (notifErr) {
            console.error('Bank notification error:', notifErr);
        }

        res.status(201).json(bank);
    } catch (err) {
        console.error('addBank error:', err);
        res.status(500).json({ error: 'Failed to add bank account' });
    }
};

// ─── DELETE /api/wallet/banks/:bankId ────────────────────────────────────────
exports.removeBank = async (req, res) => {
    try {
        const bankIdValidation = validateObjectId(req.params.bankId, 'Bank account ID');
        if (!bankIdValidation.valid) {
            return res.status(400).json({ message: bankIdValidation.message });
        }

        const bank = await BankAccount.findById(bankIdValidation.value);
        if (!bank) return res.status(404).json({ message: 'Bank account not found' });

        // Ownership: only the authenticated user can delete their own bank
        const authId = req.auth?.sub;
        if (!authId || authId !== bank.userId) {
            return res.status(403).json({ message: 'Access denied: you do not own this account' });
        }

        const { userId, bankName, accountNumberMasked } = bank;
        await BankAccount.findByIdAndDelete(bankIdValidation.value);

        // Notification for bank removal
        try {
            await new Notification({
                userId,
                title: 'Bank Unlinked',
                message: `The ${bankName} account (xxxx-${accountNumberMasked.slice(-4)}) has been removed.`,
                type: 'system'
            }).save();
        } catch (nErr) {
            console.error('Bank removal notification error:', nErr);
        }

        res.json({ message: 'Bank account removed' });
    } catch (err) {
        console.error('removeBank error:', err);
        res.status(500).json({ error: 'Failed to remove bank account' });
    }
};

// ─── GET /api/wallet/:clerkId/cards ──────────────────────────────────────────
exports.getCards = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        const cards = await Card.find({ userId: v.value });
        res.json(cards);
    } catch (err) {
        console.error('getCards error:', err);
        res.status(500).json({ error: 'Failed to retrieve cards' });
    }
};

// ─── PATCH /api/wallet/cards/:cardId/freeze ───────────────────────────────────
exports.freezeCard = async (req, res) => {
    try {
        const cardIdValidation = validateObjectId(req.params.cardId, 'Card ID');
        if (!cardIdValidation.valid) {
            return res.status(400).json({ message: cardIdValidation.message });
        }

        const card = await Card.findById(cardIdValidation.value);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== card.userId) {
            return res.status(403).json({ message: 'Access denied: you do not own this card' });
        }

        card.status = card.status === 'frozen' ? 'active' : 'frozen';
        await card.save();

        // Notification for card security change
        try {
            await new Notification({
                userId: card.userId,
                title: card.status === 'frozen' ? 'Card Frozen' : 'Card Activated',
                message: `Your ${card.brand || 'Visa'} card (xxxx-${card.last4}) has been ${card.status}.`,
                type: 'security'
            }).save();
        } catch (notifErr) {
            console.error('Card notification error:', notifErr);
        }

        res.json({ message: `Card ${card.status}`, card });
    } catch (err) {
        console.error('freezeCard error:', err);
        res.status(500).json({ error: 'Failed to update card status' });
    }
};

// ─── PATCH /api/wallet/cards/:cardId/settings ────────────────────────────────
exports.updateCardSettings = async (req, res) => {
    try {
        const cardIdValidation = validateObjectId(req.params.cardId, 'Card ID');
        if (!cardIdValidation.valid) {
            return res.status(400).json({ message: cardIdValidation.message });
        }

        // Whitelist allowed settings keys to prevent arbitrary field injection
        const allowedKeys = ['contactlessEnabled', 'onlinePayments', 'internationalPayments', 'atmWithdrawals'];
        const safeSettings = {};
        for (const key of allowedKeys) {
            if (req.body[key] !== undefined) {
                safeSettings[key] = Boolean(req.body[key]);
            }
        }

        const card = await Card.findById(cardIdValidation.value);
        if (!card) return res.status(404).json({ message: 'Card not found' });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== card.userId) {
            return res.status(403).json({ message: 'Access denied: you do not own this card' });
        }

        const updatedCard = await Card.findByIdAndUpdate(
            cardIdValidation.value,
            { $set: { settings: safeSettings } },
            { new: true }
        );

        res.json(updatedCard);
    } catch (err) {
        console.error('updateCardSettings error:', err);
        res.status(500).json({ error: 'Failed to update card settings' });
    }
};

// ─── POST /api/wallet/cards/issue ─────────────────────────────────────────────
exports.issueCard = async (req, res) => {
    try {
        const { clerkId, label, brand, color } = req.body;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        // Validate optional fields
        const cleanLabel = sanitizeText(label, 50) || 'NEW VIRTUAL CARD';
        const allowedBrands = ['VISA', 'MASTERCARD'];
        const cleanBrand = (brand && allowedBrands.includes(brand.toUpperCase())) ? brand.toUpperCase() : 'VISA';

        // Color must be a string; reject scripts/injection attempts
        const cleanColor = (typeof color === 'string' && color.length < 200 && !/<|>|script/i.test(color))
            ? color
            : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)';

        // Cap number of cards per user
        const existingCount = await Card.countDocuments({ userId: v.value });
        if (existingCount >= 10) {
            return res.status(400).json({ message: 'Maximum number of virtual cards (10) reached' });
        }

        const wallet = await Wallet.findOne({ userId: v.value });
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

        const last4 = Math.floor(1000 + Math.random() * 9000).toString();
        const card = new Card({
            userId: v.value,
            walletId: wallet._id,
            cardType: 'Virtual',
            brand: cleanBrand,
            label: cleanLabel,
            last4,
            expiry: '12/28',
            status: 'active',
            color: cleanColor
        });

        await card.save();

        try {
            await new Notification({
                userId: v.value,
                title: 'New Card Issued',
                message: `Your new ${cleanBrand} virtual card (${cleanLabel}) is now active.`,
                type: 'system'
            }).save();
        } catch (nErr) {
            console.error('Issue card notification error:', nErr);
        }

        res.status(201).json(card);
    } catch (err) {
        console.error('issueCard error:', err);
        res.status(500).json({ error: 'Failed to issue card' });
    }
};
