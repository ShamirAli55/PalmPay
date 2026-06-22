require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');

// ── Route imports ─────────────────────────────────────────────────────────────
const userRoutes        = require('./routes/userRoutes');
const palmRoutes        = require('./routes/palmRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes      = require('./routes/walletRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── DB connection ─────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅  Connected to MongoDB Atlas'))
    .catch(err => console.error('❌  MongoDB connection error:', err));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/', (_, res) => res.json({ status: 'ok', service: 'PalmPay API' }));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/users',        userRoutes);
app.use('/api/palm',         palmRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallet',       walletRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀  PalmPay API running on port ${PORT}`));
