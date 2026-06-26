const OTP = require('../models/OTP');
const User = require('../models/User');
const twilio = require('twilio');

// Configuration (Load from .env)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

exports.sendOTP = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number required' });

        // Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Save to DB (expires in 5 mins)
        await OTP.findOneAndUpdate(
            { phone },
            { code, createdAt: Date.now() },
            { upsert: true }
        );

        // Send via Twilio if available
        if (client && twilioPhone) {
            console.log(`[Twilio] Attempting real SMS to ${phone}...`);
            await client.messages.create({
                body: `Your PalmPay verification code is: ${code}`,
                from: twilioPhone,
                to: phone
            });
            return res.json({ status: 'success', message: 'Real SMS sent' });
        } else {
            // Diagnostics
            console.log(`[OTP] Falling back to Mock. Missing: ${!accountSid ? 'SID ' : ''}${!authToken ? 'TOKEN ' : ''}${!twilioPhone ? 'PHONE' : ''}`);
            
            console.log(`\n--------------------------------------`);
            console.log(`[MOCK SMS GATEWAY]`);
            console.log(`TO: ${phone}`);
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
            error: 'Failed to send SMS', 
            details: err.message,
            code: err.code // Twilio error codes are helpful
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { phone, code, clerkId } = req.body;
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

        res.json({ status: 'success', message: 'Phone linked successfully', user });
    } catch (err) {
        console.error('verifyOTP Error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
};
