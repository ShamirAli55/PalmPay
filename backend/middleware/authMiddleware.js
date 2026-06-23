const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const requireAuth = async (req, res, next) => {
    try {
        // Config check
        if (!process.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY === 'sk_test_...') {
            return res.status(500).json({ error: 'Auth Key Missing' });
        }

        // Header check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify
        try {
            const decoded = await clerkClient.verifyToken(token);
            req.auth = decoded;
            next();
        } catch (verifyErr) {
            console.error('Auth Error:', verifyErr.message);
            return res.status(401).json({ error: 'Invalid Session' });
        }
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal Error' });
    }
};

module.exports = { requireAuth };
