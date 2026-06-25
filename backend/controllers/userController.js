const User = require('../models/User');
const Wallet = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card = require('../models/Card');

// ─── Utility: Generate a unique Palm ID (username) ───────────────────────────
async function generateUniqueUsername(baseName = 'palm') {
    let base = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
    if (!base || base.length < 3) base = 'palm' + Math.floor(Math.random() * 1000);
    
    let username = base;
    let exists = await User.findOne({ username });
    let attempts = 0;
    
    while (exists && attempts < 10) {
        username = `${base}${Math.floor(Math.random() * 9999)}`;
        exists = await User.findOne({ username });
        attempts++;
    }
    return username;
}

// ─── Utility: Provision a brand-new user with all default assets ─────────────
async function provisionNewUser(clerkId, userData = {}) {
    const username = await generateUniqueUsername(userData.name || 'user');
    const user = new User({ clerkId, username, ...userData });
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
        
        // Sync profile and ensure username exists
        if (user) {
            let changed = false;
            if (req.query.name && req.query.name !== 'undefined' && user.name !== req.query.name) {
                user.name = req.query.name;
                changed = true;
            }
            if (!user.username) {
                user.username = await generateUniqueUsername(user.name || 'user');
                changed = true;
            }
            if (changed) await user.save();
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
        const users = await User.find({}, 'name clerkId phone username');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// ─── POST /api/users/update ──────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { clerkId, phone, username, name } = req.body;
        
        // Find user
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update Name
        if (name) user.name = name;

        // Update Phone
        if (phone) {
            const existing = await User.findOne({ phone, clerkId: { $ne: clerkId } });
            if (existing) return res.status(400).json({ error: 'Phone number already linked to another account' });
            user.phone = phone;
        }

        // Update Username (Palm ID)
        if (username) {
            const cleanUsername = username.replace('@', '').toLowerCase().trim();
            if (cleanUsername.length < 3) return res.status(400).json({ error: 'Palm ID must be at least 3 characters' });
            
            const existing = await User.findOne({ username: cleanUsername, clerkId: { $ne: clerkId } });
            if (existing) return res.status(400).json({ error: 'Palm ID is already taken' });
            user.username = cleanUsername;
        }

        await user.save();

        // Notification for profile update
        try {
            const Notification = require('../models/Notification');
            await new Notification({
                userId: clerkId,
                title: 'Identity Updated',
                message: `Your Palm ID was successfully updated to @${user.username || 'unassigned'}.`,
                type: 'system'
            }).save();
        } catch (nErr) {
            console.error('Profile update notification error:', nErr);
        }

        res.json({ status: 'success', user });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ error: err.message });
    }
};
