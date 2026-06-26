const Notification = require('../models/Notification');
<<<<<<< HEAD
const { validateClerkId, validateObjectId } = require('../utils/validators');
=======
>>>>>>> origin/main
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
<<<<<<< HEAD

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
=======
        const notifications = await Notification.find({ userId: clerkId }).sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
>>>>>>> origin/main
    }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
<<<<<<< HEAD

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

=======
        const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
        
        if (notif) {
>>>>>>> origin/main
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
<<<<<<< HEAD
        console.error('markAsRead error:', err);
        res.status(500).json({ error: 'Failed to mark notification as read' });
=======
        res.status(500).json({ error: err.message });
>>>>>>> origin/main
    }
};

// PATCH /api/notifications/mark-all-read/:clerkId
exports.markAllAsRead = async (req, res) => {
    try {
        const { clerkId } = req.params;
<<<<<<< HEAD

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
=======
        await Notification.updateMany({ userId: clerkId, isRead: false }, { isRead: true });
        
        emitNotificationAllRead({ clerkId });
        emitUnreadCountUpdated({ clerkId, unreadCount: 0 });

        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
>>>>>>> origin/main
    }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
<<<<<<< HEAD

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
=======
        const notif = await Notification.findByIdAndDelete(id);
        
        if (notif && !notif.isRead) {
>>>>>>> origin/main
            const unreadCount = await getUnreadCount(notif.userId);
            emitUnreadCountUpdated({ clerkId: notif.userId, unreadCount });
        }

<<<<<<< HEAD
        res.json({ message: 'Notification deleted', id: v.value });
    } catch (err) {
        console.error('deleteNotification error:', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// POST /api/notifications (internal use)
=======
        res.json({ message: 'Notification deleted', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/notifications (internal/internal use)
>>>>>>> origin/main
exports.createInternalNotification = async (userId, title, message, type) => {
    try {
        const notif = new Notification({ userId, title, message, type });
        await notif.save();
        return notif;
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};
