const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    phone: { type: String, unique: true, sparse: true },
    palmEnrolled: { type: Boolean, default: false },
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    settings: {
        notifications: { type: Boolean, default: true },
        twoFactorEnabled: { type: Boolean, default: false },
        theme: { type: String, default: 'dark' }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
