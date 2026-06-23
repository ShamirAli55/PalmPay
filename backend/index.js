require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const morgan    = require('morgan');

// Routes
const userRoutes        = require('./routes/userRoutes');
const palmRoutes        = require('./routes/palmRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes      = require('./routes/walletRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Database
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅  Connected to MongoDB Atlas'))
    .catch(err => console.error('❌  MongoDB connection error:', err));

// Health
app.get('/', (_, res) => res.json({ status: 'ok', service: 'PalmPay API' }));

// Auth
const { requireAuth } = require('./middleware/authMiddleware');

// API
app.use('/api/users',         userRoutes);
app.use('/api/palm',          palmRoutes);
app.use('/api/transactions',  requireAuth, transactionRoutes);
app.use('/api/wallet',        requireAuth, walletRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀  PalmPay API running on port ${PORT}`));
