const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
    getTransactions,
    createTransaction,
    addFunds,
    getCategories,
} = require('../controllers/transactionController');

router.get('/:clerkId', getTransactions);                        // GET  /api/transactions/:clerkId
router.get('/categories/:clerkId', getCategories);              // GET  /api/transactions/categories/:clerkId
router.post('/create', upload.single('palm_image'), createTransaction); // POST /api/transactions/create
router.post('/add-funds', upload.single('palm_image'), addFunds);  // POST /api/transactions/add-funds

module.exports = router;
