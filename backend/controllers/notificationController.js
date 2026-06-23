const Notification = require('../models/Notification');

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
        res.json({ message: 'All notifications marked as read' });
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
