const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    amount: { type: Number, required: true },
    fees: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
    category: { type: String, default: 'Other' },
    type: { type: String, enum: ['debit', 'credit', 'transfer', 'deposit', 'withdrawal'], required: true },
    paymentMethod: {
        type: { type: String, enum: ['wallet', 'bank', 'card'], default: 'wallet' },
        id: { type: String } // References the specific BankAccount or Card ID
    },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
    reference: { type: String, unique: true, default: () => `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}` },
    description: { type: String },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
