const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Linking via Clerk ID
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
    status: { type: String, enum: ['active', 'restricted', 'closed'], default: 'active' },
    limits: {
        daily: { type: Number, default: 50000 },
        monthly: { type: Number, default: 500000 }
    },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);
