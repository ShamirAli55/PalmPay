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
