require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const axios = require('axios');
const formData = require('form-data');

const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 5000;
const PALM_AUTH_URL = process.env.PALM_AUTH_URL || 'http://localhost:8000';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// Helper to get or create user by Clerk ID
async function getOrCreateUser(clerkId, userData = {}) {
    let user = await User.findOne({ clerkId });
    if (!user) {
        user = new User({ clerkId, ...userData });
        await user.save();
    }
    return user;
}

app.get("/", (_, res) => {
    res.send("Working ..");
})

// ── User Routes ─────────────────────────────────────────────────────────────

app.get('/api/user/:clerkId', async (req, res) => {
    try {
        const user = await getOrCreateUser(req.params.clerkId);
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Palm Auth Proxy ─────────────────────────────────────────────────────────

app.post('/api/palm/enroll', upload.single('file'), async (req, res) => {
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
});

app.post('/api/palm/verify', upload.single('file'), async (req, res) => {
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
});

// ── Transaction Routes ──────────────────────────────────────────────────────

app.get('/api/transactions/:clerkId', async (req, res) => {
    try {
        const user = await User.findOne({ clerkId: req.params.clerkId });
        if (!user) return res.json([]);
        const transactions = await Transaction.find({ userId: user._clerkId || user.clerkId }).sort({ date: -1 });
        // Wait, Transaction model uses userId as ObjectId. I should probably use clerkId in Transaction model too for simplicity if I'm using Clerk.
        // Let's stick to clerkId strings in Transaction model too.
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/transactions/create', upload.single('palm_image'), async (req, res) => {
    try {
        const { clerkId, recipient, amount, category, description } = req.body;

        if (!req.file) return res.status(400).json({ message: 'Palm authentication required' });

        const form = new formData();
        form.append('file', req.file.buffer, { filename: 'verify.jpg' });

        const palmResp = await axios.post(`${PALM_AUTH_URL}/verify/${clerkId}`, form, {
            headers: form.getHeaders(),
        });

        if (!palmResp.data.accepted) {
            return res.status(401).json({ message: 'Palm authentication failed', similarity: palmResp.data.similarity });
        }

        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

        const transaction = new Transaction({
            userId: clerkId, // Using clerkId as string
            sender: user.name || 'Me',
            recipient,
            amount: -Math.abs(amount),
            category,
            type: 'debit',
            description
        });

        user.balance -= Math.abs(amount);
        await user.save();
        await transaction.save();

        res.json({ message: 'Transaction successful', transaction, balance: user.balance });
    } catch (err) {
        console.error('Transaction Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Transaction failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
