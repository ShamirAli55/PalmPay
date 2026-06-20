const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String },
    balance: { type: Number, default: 12450.0 },
    palmEnrolled: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
