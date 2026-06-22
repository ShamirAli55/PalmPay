const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    cardType: { type: String, enum: ['Virtual', 'Physical'], default: 'Virtual' },
    brand: { type: String, enum: ['VISA', 'MASTERCARD', 'PAYPAK'], default: 'VISA' },
    label: { type: String, default: 'Primary Card' },
    last4: { type: String, required: true },
    expiry: { type: String, required: true }, // Format MM/YY
    cvv: { type: String }, // In real apps, this should never be stored or be heavily encrypted
    status: { type: String, enum: ['active', 'blocked', 'frozen', 'expired'], default: 'active' },
    color: { type: String, default: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)' },
    settings: {
        onlinePayments: { type: Boolean, default: true },
        internationalPayments: { type: Boolean, default: false },
        contactless: { type: Boolean, default: true }
    }
}, { timestamps: true });

module.exports = mongoose.model('Card', CardSchema);
