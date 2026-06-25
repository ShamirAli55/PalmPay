const { getIO } = require('../io');
const { WALLET_BALANCE_UPDATED } = require('../eventNames');
const { getUserRoom } = require('../socketRooms');
const { makeEvent } = require('../utils/makeEvent');

function emitWalletBalanceUpdated({ clerkId, wallet, reason, transactionId }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({
            clerkId,
            walletId: wallet._id,
            balance: wallet.balance,
            currency: wallet.currency || 'PKR',
            reason,
            transactionId
        });

        io.to(room).emit(WALLET_BALANCE_UPDATED, event);
    } catch (err) {
        console.error('Failed to emit wallet balance update:', err);
    }
}

module.exports = { emitWalletBalanceUpdated };
