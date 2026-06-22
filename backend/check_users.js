require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}
check();
