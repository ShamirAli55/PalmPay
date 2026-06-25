const Notification = require('../models/Notification');
const { 
    emitNotificationReadUpdated, 
    emitNotificationAllRead, 
    emitUnreadCountUpdated 
} = require('../realtime/emitters/notificationEmitter');

// Utility to get current unread count
const getUnreadCount = async (clerkId) => {
    return await Notification.countDocuments({ userId: clerkId, isRead: false });
};

// GET /api/notifications/:clerkId
exports.getNotifications = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const notifications = await Notification.find({ userId: clerkId }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        
        if (notif) {
            emitNotificationReadUpdated({ 
                clerkId: notif.userId, 
                notificationId: notif._id, 
                isRead: true 
            });
            const unreadCount = await getUnreadCount(notif.userId);
            emitUnreadCountUpdated({ clerkId: notif.userId, unreadCount });
        }

        res.json(notif);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/notifications/mark-all-read/:clerkId
exports.markAllAsRead = async (req, res) => {
    try {
        const { clerkId } = req.params;
        await Notification.updateMany({ userId: clerkId, isRead: false }, { isRead: true });
        
        emitNotificationAllRead({ clerkId });
        emitUnreadCountUpdated({ clerkId, unreadCount: 0 });

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const notif = await Notification.findByIdAndDelete(id);
        
        if (notif && !notif.isRead) {
            const unreadCount = await getUnreadCount(notif.userId);
            emitUnreadCountUpdated({ clerkId: notif.userId, unreadCount });
        }

        res.json({ message: 'Notification deleted', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/notifications (internal/internal use)
exports.createInternalNotification = async (userId, title, message, type) => {
    try {
        const notif = new Notification({ userId, title, message, type });
        await notif.save();
        return notif;
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};
