const axios    = require('axios');
const formData = require('form-data');
const User     = require('../models/User');
const { validateClerkId } = require('../utils/validators');

const PALM_AUTH_URL = process.env.PALM_AUTH_URL || 'http://localhost:8000';

// Allowed MIME types for palm images
const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_FILE_SIZE = 1000;   // 1 KB minimum
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB maximum

function validatePalmFile(file) {
    if (!file) return 'No file uploaded';
    if (!ALLOWED_MIME.includes(file.mimetype)) return 'Invalid file type. Only JPEG, PNG, and WebP images are accepted';
    if (file.size < MIN_FILE_SIZE) return 'Image is too small or corrupted';
    if (file.size > MAX_FILE_SIZE) return 'Image is too large (max 10 MB)';
    return null;
}

// ─── POST /api/palm/enroll ───────────────────────────────────────────────────
exports.enrollPalm = async (req, res) => {
    try {
        const { clerkId } = req.body;

        // Validate clerkId
        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        // Validate file
        const fileErr = validatePalmFile(req.file);
        if (fileErr) return res.status(400).json({ message: fileErr });

        const form = new formData();
        form.append('file', req.file.buffer, { filename: req.file.originalname || 'palm.jpg' });

        let response;
        try {
            response = await axios.post(`${PALM_AUTH_URL}/enroll/${v.value}`, form, {
                headers: form.getHeaders(),
                timeout: 30000,
            });
        } catch (axErr) {
            console.error('Palm Enroll Service Error:', axErr.response?.data || axErr.message);
            return res.status(503).json({ error: 'Biometric service unavailable. Please try again.' });
        }

        if (response.data.status === 'enrolled') {
            await User.findOneAndUpdate({ clerkId: v.value }, { palmEnrolled: true });
            
            // Notification for enrollment
            try {
                const Notification = require('../models/Notification');
                await new Notification({
                    userId: v.value,
                    title: 'Biometrics Enrolled',
                    message: 'Your palm biometric signature has been successfully registered. You can now use it for secure transactions.',
                    type: 'security'
                }).save();
            } catch (nErr) {
                console.error('Palm enroll notification error:', nErr);
            }
        }

        res.json(response.data);
    } catch (err) {
        console.error('Palm Enroll Error:', err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};

// ─── POST /api/palm/verify ───────────────────────────────────────────────────
exports.verifyPalm = async (req, res) => {
    try {
        const { clerkId } = req.body;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        const fileErr = validatePalmFile(req.file);
        if (fileErr) return res.status(400).json({ message: fileErr });

        const form = new formData();
        form.append('file', req.file.buffer, { filename: req.file.originalname || 'palm.jpg' });

        let response;
        try {
            response = await axios.post(`${PALM_AUTH_URL}/verify/${v.value}`, form, {
                headers: form.getHeaders(),
                timeout: 15000,
            });
        } catch (axErr) {
            console.error('Palm Verify Service Error:', axErr.response?.data || axErr.message);
            return res.status(503).json({ error: 'Biometric service unavailable. Please try again.' });
        }

        res.json(response.data);
    } catch (err) {
        console.error('Palm Verify Error:', err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};

// ─── POST /api/palm/verify-multi ─────────────────────────────────────────────
exports.verifyPalmMulti = async (req, res) => {
    try {
        const { clerkId } = req.body;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ message: v.message });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No frames uploaded' });
        }

        // Cap frames to prevent abuse
        if (req.files.length > 30) {
            return res.status(400).json({ message: 'Too many frames (max 30)' });
        }

        // Validate each frame
        for (const f of req.files) {
            const frameErr = validatePalmFile(f);
            if (frameErr) return res.status(400).json({ message: `Frame validation failed: ${frameErr}` });
        }

        const form = new formData();
        req.files.forEach((f, i) => {
            form.append('files', f.buffer, { filename: `frame_${i}.jpg` });
        });

        let response;
        try {
            response = await axios.post(`${PALM_AUTH_URL}/verify-multi/${v.value}`, form, {
                headers: form.getHeaders(),
                timeout: 30000,
            });
        } catch (axErr) {
            console.error('Palm Verify-Multi Service Error:', axErr.response?.data || axErr.message);
            return res.status(503).json({ error: 'Biometric service unavailable. Please try again.' });
        }

        res.json(response.data);
    } catch (err) {
        console.error('Palm Verify-Multi Error:', err.message);
        res.status(500).json({ error: 'Palm service error' });
    }
};
