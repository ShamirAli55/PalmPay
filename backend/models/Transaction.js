const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Clerk ID
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    status: { type: String, default: 'Completed' },
    date: { type: Date, default: Date.now },
    description: { type: String }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
