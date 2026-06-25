const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/:clerkId', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/mark-all-read/:clerkId', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
