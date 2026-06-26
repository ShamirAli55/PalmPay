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

const http = require('http');
const { initSocketServer } = require('./realtime/socketServer');

const server = http.createServer(app);
initSocketServer(server);

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
const upload          = require('./middleware/upload');

// API
app.use('/api/users',         userRoutes);
app.use('/api/palm',          palmRoutes);
app.use('/api/transactions',  requireAuth, transactionRoutes);
app.use('/api/wallet',        requireAuth, walletRoutes);
app.use('/api/notifications', requireAuth, notificationRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Multer-specific error handler (must come before the generic one)
app.use((err, req, res, next) => {
    const multer = require('multer');
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
    }
    next(err);
});

// Generic error handler — never expose stack traces in production
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err.status || err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : (err.message || 'Internal server error');
    res.status(status).json({ error: message });
});

server.listen(PORT, () => console.log(`🚀  PalmPay API running on port ${PORT}`));
