const User = require('../models/User');
const Wallet = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card = require('../models/Card');

// ─── Utility: Provision a brand-new user with all default assets ─────────────
async function provisionNewUser(clerkId, userData = {}) {
    const user = new User({ clerkId, ...userData });
    await user.save();

    const wallet = new Wallet({ userId: clerkId, balance: 25000.0 });
    await wallet.save();

    const defaultBanks = [
        { userId: clerkId, bankName: 'HBL Bank', accountNumberMasked: '•••• 4920', balance: 45000, accountHolderName: userData.name || 'User' },
        { userId: clerkId, bankName: 'Meezan Bank', accountNumberMasked: '•••• 1155', balance: 82000, accountHolderName: userData.name || 'User' },
        { userId: clerkId, bankName: 'Easypaisa', accountNumberMasked: '•••• 8829', balance: 12500, accountHolderName: userData.name || 'User' },
    ];
    await BankAccount.insertMany(defaultBanks);

    const card = new Card({
        userId: clerkId,
        walletId: wallet._id,
        cardType: 'Virtual',
        brand: 'VISA',
        label: 'PLATINUM PRIME',
        last4: '8829',
        expiry: '12/26',
        status: 'active',
        balance: 5000.0
    });
    await card.save();

    return user;
}

// ─── Utility: Serialize bank docs for API response ───────────────────────────
function serializeBank(b) {
    return {
        id: b._id,
        bankId: b._id,
        name: b.bankName,
        last4: b.accountNumberMasked.split(' ').pop(),
        balance: b.balance,
    };
}

// ─── GET /api/user/:clerkId ──────────────────────────────────────────────────
exports.getUser = async (req, res) => {
    try {
        const { clerkId } = req.params;

        let user = await User.findOne({ clerkId });
        
        // Always sync basic profile info from Clerk if provided in query
        if (user && req.query.name && req.query.name !== 'undefined') {
            user.name = req.query.name;
            await user.save();
        }

        if (!user) user = await provisionNewUser(clerkId, { name: req.query.name || 'Palm User' });

        let wallet = await Wallet.findOne({ userId: clerkId });
        if (!wallet) {
            wallet = new Wallet({ userId: clerkId, balance: 25000.0 });
            await wallet.save();
        } else if (wallet.balance === 0) {
            wallet.balance = 25000.0;
            await wallet.save();
        }

        const [banks, cards] = await Promise.all([
            BankAccount.find({ userId: clerkId }),
            Card.find({ userId: clerkId }),
        ]);

        res.json({
            ...user._doc,
            balance: wallet?.balance ?? 0,
            linkedBanks: banks.map(serializeBank),
            cards: cards.map(c => ({
                id: c._id,
                label: c.label,
                last4: c.last4,
                expiry: c.expiry,
                brand: c.brand,
                network: c.brand, // Compatibility
                color: c.color,
                status: c.status,
                holder: user.name || 'Palm User',
                balance: wallet?.balance || 0,
                settings: c.settings,
                frozen: c.status === 'frozen'
            })),
        });
    } catch (err) {
        console.error('getUser error:', err);
        res.status(500).json({ error: err.message });
    }
};

// ─── GET /api/users ──────────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name clerkId phone');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// ─── POST /api/users/update ──────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { clerkId, phone } = req.body;
        
        // Find user
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update fields
        if (phone) {
            // Check if phone already taken by another user
            const existing = await User.findOne({ phone, clerkId: { $ne: clerkId } });
            if (existing) return res.status(400).json({ error: 'Phone number already linked to another account' });
            user.phone = phone;
        }

        await user.save();
        res.json({ status: 'success', user });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};
