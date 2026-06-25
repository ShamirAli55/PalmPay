const axios    = require('axios');
const formData = require('form-data');
const User     = require('../models/User');

const PALM_AUTH_URL = process.env.PALM_AUTH_URL || 'http://localhost:8000';

// ─── POST /api/palm/enroll ───────────────────────────────────────────────────
exports.enrollPalm = async (req, res) => {
    try {
        const { clerkId } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const form = new formData();
        form.append('file', req.file.buffer, { filename: req.file.originalname });

        const response = await axios.post(`${PALM_AUTH_URL}/enroll/${clerkId}`, form, {
            headers: form.getHeaders(),
        });

        if (response.data.status === 'enrolled') {
            await User.findOneAndUpdate({ clerkId }, { palmEnrolled: true });
            
            // Notification for enrollment
            try {
                const Notification = require('../models/Notification');
                await new Notification({
                    userId: clerkId,
                    title: 'Biometrics Enrolled',
                    message: 'Your palm biometric signature has been successfully registered. You can now use it for secure transactions.',
                    type: 'security'
                }).save();
            } catch (nErr) {}
        }

        res.json(response.data);
    } catch (err) {
        console.error('Palm Enroll Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};

// ─── POST /api/palm/verify ───────────────────────────────────────────────────
exports.verifyPalm = async (req, res) => {
    try {
        const { clerkId } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const form = new formData();
        form.append('file', req.file.buffer, { filename: req.file.originalname });

        const response = await axios.post(`${PALM_AUTH_URL}/verify/${clerkId}`, form, {
            headers: form.getHeaders(),
        });

        res.json(response.data);
    } catch (err) {
        console.error('Palm Verify Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};

// ─── POST /api/palm/verify-multi ─────────────────────────────────────────────
// Receives N frames (req.files via upload.array) captured in one long scan,
// forwards them to Python's /verify-multi endpoint which averages the probe
// embeddings internally before comparing to the stored template.
exports.verifyPalmMulti = async (req, res) => {
    try {
        const { clerkId } = req.body;
        if (!req.files || req.files.length === 0)
            return res.status(400).json({ message: 'No frames uploaded' });

        const form = new formData();
        req.files.forEach((f, i) => {
            form.append('files', f.buffer, { filename: `frame_${i}.jpg` });
        });

        const response = await axios.post(`${PALM_AUTH_URL}/verify-multi/${clerkId}`, form, {
            headers: form.getHeaders(),
        });

        res.json(response.data);
    } catch (err) {
        console.error('Palm Verify-Multi Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};
