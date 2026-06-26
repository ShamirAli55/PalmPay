const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 mins
});

module.exports = mongoose.model('OTP', OTPSchema);
