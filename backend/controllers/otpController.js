const OTP = require('../models/OTP');
const User = require('../models/User');
const twilio = require('twilio');
<<<<<<< HEAD
const { validatePhone, sanitizeText } = require('../utils/validators');
=======
>>>>>>> origin/main

// Configuration (Load from .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

<<<<<<< HEAD
// OTP rate limiting: track send timestamps per phone (in-memory, simple)
const otpSendTimestamps = new Map();
const OTP_COOLDOWN_MS = 60 * 1000; // 60 seconds between resends

exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        // Validate phone
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
            return res.status(400).json({ error: phoneValidation.message });
        }
        const cleanPhone = phoneValidation.value;

        // Rate limiting: prevent OTP spam
        const lastSent = otpSendTimestamps.get(cleanPhone);
        if (lastSent && (Date.now() - lastSent) < OTP_COOLDOWN_MS) {
            const waitSecs = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
            return res.status(429).json({ error: `Please wait ${waitSecs} seconds before requesting a new code` });
        }
=======
exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });
>>>>>>> origin/main

        // Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

<<<<<<< HEAD
        // Save to DB (expires in 5 mins via TTL index)
        await OTP.findOneAndUpdate(
            { phone: cleanPhone },
=======
        // Save to DB (expires in 5 mins)
        await OTP.findOneAndUpdate(
            { phone },
>>>>>>> origin/main
            { code, createdAt: Date.now() },
            { upsert: true }
        );

<<<<<<< HEAD
        // Record send time for rate limiting
        otpSendTimestamps.set(cleanPhone, Date.now());

        // Send via Twilio if available
        if (client && twilioPhone) {
            console.log(`[Twilio] Attempting real SMS to ${cleanPhone}...`);
            await client.messages.create({
                body: `Your PalmPay verification code is: ${code}`,
                from: twilioPhone,
                to: cleanPhone
            });
            return res.json({ status: 'success', message: 'Verification code sent' });
=======
        // Send via Twilio if available
        if (client && twilioPhone) {
            console.log(`[Twilio] Attempting real SMS to ${phone}...`);
            await client.messages.create({
                body: `Your PalmPay verification code is: ${code}`,
                from: twilioPhone,
                to: phone
            });
            return res.json({ status: 'success', message: 'Real SMS sent' });
>>>>>>> origin/main
        } else {
            // Diagnostics
            console.log(`[OTP] Falling back to Mock. Missing: ${!accountSid ? 'SID ' : ''}${!authToken ? 'TOKEN ' : ''}${!twilioPhone ? 'PHONE' : ''}`);
            
            console.log(`\n--------------------------------------`);
            console.log(`[MOCK SMS GATEWAY]`);
<<<<<<< HEAD
            console.log(`TO: ${cleanPhone}`);
=======
            console.log(`TO: ${phone}`);
>>>>>>> origin/main
            console.log(`CODE: ${code}`);
            console.log(`--------------------------------------\n`);

            return res.json({ 
                status: 'mock', 
                message: 'Demo Mode: SMS skipped (keys missing or backend restart needed).',
                code: code // Always return code in mock mode for testing
            });
        }
    } catch (err) {
        console.error('sendOTP Error:', err);
        res.status(500).json({ 
<<<<<<< HEAD
            error: 'Failed to send verification code'
            // Do NOT expose err.message or Twilio error codes to client in production
=======
            error: 'Failed to send SMS', 
            details: err.message,
            code: err.code // Twilio error codes are helpful
>>>>>>> origin/main
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, code, clerkId } = req.body;
<<<<<<< HEAD

        // Validate all required fields
        if (!phone || !code || !clerkId) {
            return res.status(400).json({ error: 'Phone number, code, and user ID are all required' });
        }

        // Validate phone
        const phoneValidation = validatePhone(phone);
        if (!phoneValidation.valid) {
            return res.status(400).json({ error: phoneValidation.message });
        }
        const cleanPhone = phoneValidation.value;

        // Validate code format (must be exactly 6 digits)
        const cleanCode = sanitizeText(code, 6).trim();
        if (!/^\d{6}$/.test(cleanCode)) {
            return res.status(400).json({ error: 'Verification code must be exactly 6 digits' });
        }

        // Validate clerkId
        if (typeof clerkId !== 'string' || clerkId.trim().length < 5) {
            return res.status(400).json({ error: 'Invalid user identifier' });
        }

        // Find and validate OTP record
        const record = await OTP.findOne({ phone: cleanPhone, code: cleanCode });
        if (!record) return res.status(400).json({ error: 'Invalid or expired verification code' });

        // OTP expiry check (belt-and-suspenders on top of MongoDB TTL)
        const ageMs = Date.now() - new Date(record.createdAt).getTime();
        if (ageMs > 5 * 60 * 1000) {
            await OTP.deleteOne({ _id: record._id });
            return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
        }

        // Find user
        const user = await User.findOne({ clerkId: clerkId.trim() });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Uniqueness check
        const existing = await User.findOne({ phone: cleanPhone, clerkId: { $ne: clerkId.trim() } });
        if (existing) return res.status(400).json({ error: 'Phone already linked to another account' });

        user.phone = cleanPhone;
        await user.save();

        // Delete used OTP immediately after successful verification
        await OTP.deleteOne({ _id: record._id });

        // Clear rate-limit entry on success
        otpSendTimestamps.delete(cleanPhone);

=======
        if (!phone || !code || !clerkId) return res.status(400).json({ error: 'Missing parameters' });

        // Find record
        const record = await OTP.findOne({ phone, code });
        if (!record) return res.status(400).json({ error: 'Invalid or expired code' });

        // Success! Link the phone to the user
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Uniqueness check
        const existing = await User.findOne({ phone, clerkId: { $ne: clerkId } });
        if (existing) return res.status(400).json({ error: 'Phone already linked to another account' });

        user.phone = phone;
        await user.save();

        // Delete used OTP
        await OTP.deleteOne({ _id: record._id });

>>>>>>> origin/main
        res.json({ status: 'success', message: 'Phone linked successfully', user });
    } catch (err) {
        console.error('verifyOTP Error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
};
