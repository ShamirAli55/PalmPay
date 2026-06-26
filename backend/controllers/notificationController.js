const Notification = require('../models/Notification');
const { validateClerkId, validateObjectId } = require('../utils/validators');
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

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ error: v.message });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== v.value) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const notifications = await Notification.find({ userId: v.value }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        console.error('getNotifications error:', err);
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const v = validateObjectId(id, 'Notification ID');
        if (!v.valid) return res.status(400).json({ error: v.message });

        const notif = await Notification.findById(v.value);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== notif.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Idempotent: only update if not already read
        if (!notif.isRead) {
            notif.isRead = true;
            await notif.save();

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
        console.error('markAsRead error:', err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// PATCH /api/notifications/mark-all-read/:clerkId
exports.markAllAsRead = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const v = validateClerkId(clerkId);
        if (!v.valid) return res.status(400).json({ error: v.message });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== v.value) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Notification.updateMany({ userId: v.value, isRead: false }, { isRead: true });
        
        emitNotificationAllRead({ clerkId: v.value });
        emitUnreadCountUpdated({ clerkId: v.value, unreadCount: 0 });

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('markAllAsRead error:', err);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const v = validateObjectId(id, 'Notification ID');
        if (!v.valid) return res.status(400).json({ error: v.message });

        const notif = await Notification.findById(v.value);
        if (!notif) return res.status(404).json({ error: 'Notification not found' });

        // Ownership check
        const authId = req.auth?.sub;
        if (!authId || authId !== notif.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const wasUnread = !notif.isRead;
        await Notification.findByIdAndDelete(v.value);
        
        if (wasUnread) {
            const unreadCount = await getUnreadCount(notif.userId);
            emitUnreadCountUpdated({ clerkId: notif.userId, unreadCount });
        }

        res.json({ message: 'Notification deleted', id: v.value });
    } catch (err) {
        console.error('deleteNotification error:', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// POST /api/notifications (internal use)
exports.createInternalNotification = async (userId, title, message, type) => {
    try {
        const notif = new Notification({ userId, title, message, type });
        await notif.save();
        return notif;
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};
