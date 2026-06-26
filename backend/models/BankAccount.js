const mongoose = require('mongoose');

const BankAccountSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    bankName: { type: String, required: true },
    accountHolderName: { type: String, required: true },
    accountNumberMasked: { type: String, required: true }, // e.g. "•••• 4920"
    routingNumber: { type: String },
    accountType: { type: String, enum: ['Checking', 'Savings', 'Wallet'], default: 'Checking' },
    balance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    provider: { type: String, default: 'Manual' }, // or 'Plaid', 'Stripe' etc
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('BankAccount', BankAccountSchema);
