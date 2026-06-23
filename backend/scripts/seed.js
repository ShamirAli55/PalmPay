require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

const MONGODB_URI = process.env.MONGODB_URI;

const TEST_CLERK_ID = "user_2iInVjG3XpxxN2P6zXq7UvR6kZ5"; // Example ID, change if needed
const FALLBACK_ID = "test_user";

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("Connected.");

        // Clear existing data for test users
        await User.deleteMany({ clerkId: { $in: [TEST_CLERK_ID, FALLBACK_ID] } });
        await Transaction.deleteMany({ userId: { $in: [TEST_CLERK_ID, FALLBACK_ID] } });

        console.log("Cleared old test data.");

        const users = [
            {
                clerkId: TEST_CLERK_ID,
                name: "Shamir Ali",
                email: "shamir@example.com",
                phone: "+923001234567",
                balance: 14250.75,
                palmEnrolled: true
            },
            {
                clerkId: FALLBACK_ID,
                name: "Test Account",
                email: "test@example.com",
                phone: "+923000000000",
                balance: 5000.00,
                palmEnrolled: false
            }
        ];

        await User.insertMany(users);
        console.log("Inserted users.");

        const transactions = [
            {
                userId: TEST_CLERK_ID,
                sender: "Node Protocol",
                recipient: "Shamir Ali",
                amount: 1299.00,
                category: "Income",
                type: "credit",
                description: "Staking Reward - Epoch 84",
                date: new Date(Date.now() - 3600000) // 1h ago
            },
            {
                userId: TEST_CLERK_ID,
                sender: "Shamir Ali",
                recipient: "Tesla Supercharger",
                amount: -45.50,
                category: "Transport",
                type: "debit",
                description: "Energy refill - Soho",
                date: new Date(Date.now() - 86400000) // Yesterday
            },
            {
                userId: TEST_CLERK_ID,
                sender: "Stripe Payout",
                recipient: "Shamir Ali",
                amount: 4500.00,
                category: "Income",
                type: "credit",
                description: "Service Fees - Project Alpha",
                date: new Date(Date.now() - 172800000) // 2 days ago
            },
            {
                userId: TEST_CLERK_ID,
                sender: "Shamir Ali",
                recipient: "Apple Store",
                amount: -129.00,
                category: "Shopping",
                type: "debit",
                description: "AirTags Pack",
                date: new Date(Date.now() - 259200000) // 3 days ago
            },
            {
                userId: TEST_CLERK_ID,
                sender: "Binance",
                recipient: "Shamir Ali",
                amount: 2100.00,
                category: "Income",
                type: "credit",
                description: "USDT Settlement",
                date: new Date(Date.now() - 604800000) // 1 week ago
            },
            {
                userId: TEST_CLERK_ID,
                sender: "Shamir Ali",
                recipient: "AWS Cloud",
                amount: -340.00,
                category: "Business",
                type: "debit",
                description: "Monthly Infrastructure",
                date: new Date(Date.now() - 1209600000) // 2 weeks ago
            }
        ];

        await Transaction.insertMany(transactions);
        console.log(`Seeded ${transactions.length} transactions.`);

        console.log("Seeding complete. Exiting...");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
