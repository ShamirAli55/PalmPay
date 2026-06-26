const User = require('../models/User');
const Wallet = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card = require('../models/Card');
const { validateClerkId, sanitizeText } = require('../utils/validators');

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

        if (!clerkId || typeof clerkId !== 'string' || clerkId.trim() === '') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Sanitise optional name query param (prevent XSS / injection)
        const rawName = req.query.name;
        const cleanName = (rawName && rawName !== 'undefined' && rawName !== 'null')
            ? sanitizeText(rawName, 100)
            : null;

        let user = await User.findOne({ clerkId });

        // Sync profile and ensure username exists
        if (user) {
            let changed = false;
            if (cleanName && user.name !== cleanName) {
                user.name = cleanName;
                changed = true;
            }
            if (!user.username) {
                user.username = await generateUniqueUsername(user.name || 'user');
                changed = true;
            }
            if (changed) await user.save();
        }

        if (!user) user = await provisionNewUser(clerkId, { name: cleanName || 'Palm User' });

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
        res.status(500).json({ error: 'Failed to retrieve user data' });
    }
};

// ─── GET /api/users ──────────────────────────────────────────────────────────
exports.listUsers = async (req, res) => {
    try {
        // Only expose the minimum fields needed for recipient search
        const users = await User.find({}, 'name clerkId phone username');
        res.json(users);
    } catch (err) {
        console.error('listUsers error:', err);
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

// ─── POST /api/users/update ──────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
    try {
        const { clerkId, phone, username, name } = req.body;

        // Validate clerkId
        const clerkIdValidation = validateClerkId(clerkId);
        if (!clerkIdValidation.valid) {
            return res.status(400).json({ error: clerkIdValidation.message });
        }

        // At least one field must be provided
        if (!name && !phone && !username) {
            return res.status(400).json({ error: 'At least one field (name, phone, username) must be provided' });
        }

        // Find user
        const user = await User.findOne({ clerkId: clerkIdValidation.value });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update Name
        if (name !== undefined && name !== null) {
            const cleanName = sanitizeText(name, 100);
            if (cleanName.length < 1) return res.status(400).json({ error: 'Name cannot be empty' });
            if (cleanName.length > 100) return res.status(400).json({ error: 'Name too long (max 100 characters)' });
            // Reject names with only numbers or special characters
            if (!/[a-zA-Z]/.test(cleanName)) return res.status(400).json({ error: 'Name must contain at least one letter' });
            user.name = cleanName;
        }

        // Update Phone
        if (phone !== undefined && phone !== null && phone !== '') {
            const cleanPhone = sanitizeText(phone, 20);
            if (!/^\+?[\d\s\-]{7,16}$/.test(cleanPhone)) {
                return res.status(400).json({ error: 'Invalid phone number format' });
            }
            const existing = await User.findOne({ phone: cleanPhone, clerkId: { $ne: clerkIdValidation.value } });
            if (existing) return res.status(400).json({ error: 'Phone number already linked to another account' });
            user.phone = cleanPhone;
        }

        // Update Username (Palm ID)
        if (username !== undefined && username !== null && username !== '') {
            const cleanUsername = sanitizeText(username, 30).replace('@', '').toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (cleanUsername.length < 3) return res.status(400).json({ error: 'Palm ID must be at least 3 characters' });
            if (cleanUsername.length > 30) return res.status(400).json({ error: 'Palm ID must be 30 characters or less' });
            if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) return res.status(400).json({ error: 'Palm ID can only contain letters, numbers, and underscores' });

            const existing = await User.findOne({ username: cleanUsername, clerkId: { $ne: clerkIdValidation.value } });
            if (existing) return res.status(400).json({ error: 'Palm ID is already taken' });
            user.username = cleanUsername;
        }

        await user.save();

        // ─── Dynamic Notification Logic ───────────────────────────────────────
        try {
            const Notification = require('../models/Notification');
            let title = 'Profile Updated';
            let message = 'Your account details have been successfully synchronized.';

            if (phone && !username) {
                title = 'Phone Linked';
                message = `Your mobile number ${sanitizeText(phone, 20)} is now securely linked to your PalmPay identity.`;
            } else if (username && !phone) {
                title = 'Palm ID Updated';
                message = `Your unique Palm ID has been set to @${user.username}.`;
            } else if (username && phone) {
                title = 'Identity Finalized';
                message = `Your Palm ID @${user.username} and phone number are now fully synchronized.`;
            }

            await new Notification({
                userId: clerkIdValidation.value,
                title,
                message,
                type: 'system'
            }).save();
        } catch (nErr) {
            console.error('Profile update notification error:', nErr);
        }

        res.json({ status: 'success', user });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
