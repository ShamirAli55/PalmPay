const { getIO } = require('../io');
const { TRANSACTION_CREATED } = require('../eventNames');
const { getUserRoom } = require('../socketRooms');
const { makeEvent } = require('../utils/makeEvent');

function emitTransactionCreated({ clerkId, transaction }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({
            clerkId,
            transaction
        });

        io.to(room).emit(TRANSACTION_CREATED, event);
    } catch (err) {
        console.error('Failed to emit transaction created:', err);
    }
}

module.exports = { emitTransactionCreated };
