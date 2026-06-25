const { Server } = require('socket.io');
const { setIO } = require('./io');
const { socketAuthMiddleware } = require('./socketAuth');
const { getUserRoom } = require('./socketRooms');

function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Adjust for production if needed
            methods: ["GET", "POST"]
        }
    });

    // Auth Middleware
    io.use(socketAuthMiddleware);

    io.on('connection', (socket) => {
        const clerkId = socket.data.clerkId;
        const room = getUserRoom(clerkId);
        
        console.log(`📡 Socket connected: ${socket.id} (User: ${clerkId})`);
        
        // Join user-specific room
        socket.join(room);

        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id}`);
        });
    });

    setIO(io);
    return io;
}

module.exports = { initSocketServer };
