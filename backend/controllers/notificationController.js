import Notification from '../models/Notification.js';

// GET /api/user/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// PUT /api/user/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

// PUT /api/user/notifications/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

// DELETE /api/user/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// DELETE /api/user/notifications
export const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
};

// Helper — called internally by other controllers to create notifications
export const createNotification = async (userId, { title, message, type = 'system', link = '' }) => {
  try {
    await Notification.create({ user: userId, title, message, type, link });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};