const { getIO } = require('../io');
const { 
    NOTIFICATION_NEW, 
    NOTIFICATION_READ_UPDATED, 
    NOTIFICATION_ALL_READ,
    NOTIFICATION_UNREAD_COUNT_UPDATED 
} = require('../eventNames');
const { getUserRoom } = require('../socketRooms');
const { makeEvent } = require('../utils/makeEvent');

function emitNotificationNew({ clerkId, notification }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({
            clerkId,
            notification
        });

        io.to(room).emit(NOTIFICATION_NEW, event);
    } catch (err) {
        console.error('Failed to emit new notification:', err);
    }
}

function emitNotificationReadUpdated({ clerkId, notificationId, isRead }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({
            clerkId,
            notificationId,
            isRead
        });

        io.to(room).emit(NOTIFICATION_READ_UPDATED, event);
    } catch (err) {
        console.error('Failed to emit notification read update:', err);
    }
}

function emitNotificationAllRead({ clerkId }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({ clerkId });

        io.to(room).emit(NOTIFICATION_ALL_READ, event);
    } catch (err) {
        console.error('Failed to emit notifications all read:', err);
    }
}

function emitUnreadCountUpdated({ clerkId, unreadCount }) {
    try {
        const io = getIO();
        const room = getUserRoom(clerkId);
        
        const event = makeEvent({
            clerkId,
            unreadCount
        });

        io.to(room).emit(NOTIFICATION_UNREAD_COUNT_UPDATED, event);
    } catch (err) {
        console.error('Failed to emit unread count update:', err);
    }
}

module.exports = {
    emitNotificationNew,
    emitNotificationReadUpdated,
    emitNotificationAllRead,
    emitUnreadCountUpdated
};
