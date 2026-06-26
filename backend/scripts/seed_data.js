require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const BankAccount = require('../models/BankAccount');
const Card = require('../models/Card');
const Transaction = require('../models/Transaction');

const MONGODB_URI = process.env.MONGODB_URI;

const CATEGORIES = ['Shopping', 'Dining', 'Rent', 'Utils', 'Transfer', 'Groceries', 'Entertainment', 'Transport'];
const MERCHANTS = {
    Shopping: ['Amazon', 'eBay', 'AliExpress', 'Daraz', 'Nike', 'Apple'],
    Dining: ['FoodPanda', 'KFC', 'McDonalds', 'Espresso', 'Nandos'],
    Rent: ['Housing Society', 'Rent Payment', 'Apartment Management'],
    Utils: ['KElectric', 'Sui Gas', 'Water Board', 'PTCL', 'StormFiber'],
    Transfer: ['Internal P2P', 'Friend Payment', 'Shared Bill'],
    Groceries: ['Carrefour', 'Al-Fatah', 'Imtiaz Store', 'Local Market'],
    Entertainment: ['Netflix', 'Spotify', 'Prime Video', 'Cinema'],
    Transport: ['Uber', 'Careem', 'Bykea', 'Shell Gas', 'Total Parco']
};

async function seedData() {
    try {
        console.log("🚀 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected.");

        const users = await User.find({});
        if (users.length === 0) {
            console.log("⚠️ No users found. Please sign in first.");
            process.exit(0);
        }

        for (const user of users) {
            const clerkId = user.clerkId;
            console.log(`\n👤 Seeding for: ${user.name || clerkId}`);

            let wallet = await Wallet.findOne({ userId: clerkId });
            if (!wallet) {
                wallet = new Wallet({ userId: clerkId, balance: 25000 });
                await wallet.save();
            }

            const bankCount = await BankAccount.countDocuments({ userId: clerkId });
            if (bankCount === 0) {
                await BankAccount.insertMany([
                    { userId: clerkId, bankName: "HBL Bank", accountNumberMasked: "•••• 4920", balance: 145000, accountHolderName: user.name || 'User' },
                    { userId: clerkId, bankName: "Meezan Bank", accountNumberMasked: "•••• 1155", balance: 282000, accountHolderName: user.name || 'User' },
                    { userId: clerkId, bankName: "Easypaisa", accountNumberMasked: "•••• 8829", balance: 32500, accountHolderName: user.name || 'User' },
                ]);
            }

            await Card.deleteMany({ userId: clerkId }); // Refresh cards
            await Card.insertMany([
                {
                    userId: clerkId,
                    walletId: wallet._id,
                    cardType: 'Virtual',
                    brand: 'VISA',
                    label: 'PLATINUM PRIME',
                    last4: '8829',
                    expiry: '12/26',
                    status: 'active',
                    color: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                },
                {
                    userId: clerkId,
                    walletId: wallet._id,
                    cardType: 'Virtual',
                    brand: 'MASTERCARD',
                    label: 'STEALTH BLACK',
                    last4: '2048',
                    expiry: '08/28',
                    status: 'active',
                    color: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                },
                {
                    userId: clerkId,
                    walletId: wallet._id,
                    cardType: 'Virtual',
                    brand: 'VISA',
                    label: 'INDIGO PRIORITY',
                    last4: '4452',
                    expiry: '05/27',
                    status: 'active',
                    color: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)'
                }
            ]);

            await Transaction.deleteMany({ userId: clerkId });
            const txns = [];
            for (let i = 0; i < 50; i++) {
                const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
                const merchantsForCat = MERCHANTS[category];
                const merchant = merchantsForCat[Math.floor(Math.random() * merchantsForCat.length)];
                const type = (category === 'Transfer' || Math.random() > 0.8) ? (Math.random() > 0.5 ? 'credit' : 'debit') : 'debit';
                const amount = parseFloat((Math.random() * 5000 + 50).toFixed(2));
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                txns.push({
                    userId: clerkId,
                    sender: type === 'credit' ? merchant : (user.name || 'Me'),
                    recipient: type === 'credit' ? (user.name || 'Me') : merchant,
                    amount: type === 'debit' ? -amount : amount,
                    category: category,
                    type: type,
                    description: `${category} at ${merchant}`,
                    date: date,
                    status: 'completed',
                    paymentMethod: { type: Math.random() > 0.5 ? 'wallet' : 'bank' }
                });
            }
            await Transaction.insertMany(txns);
            console.log(`  - ✅ Seeding for ${user.name} complete.`);
        }

        console.log("\n✨ Database refreshed.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
}

seedData();
