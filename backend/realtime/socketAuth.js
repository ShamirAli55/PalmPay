const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function socketAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }

        try {
            const decoded = await clerkClient.verifyToken(token);
            socket.data.auth = decoded;
            socket.data.clerkId = decoded.sub;
            next();
        } catch (err) {
            console.error('Socket Auth Error:', err.message);
            next(new Error('Authentication error: Invalid session'));
        }
    } catch (err) {
        console.error('Socket Auth Middleware Error:', err);
        next(new Error('Internal server error during authentication'));
    }
}

module.exports = { socketAuthMiddleware };
