const express = require('express');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { emitNotification } = require('../config/socket');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    let query;
    let params;
    
    if (userType === 'admin') {
      query = 'SELECT * FROM Notifications WHERE AdminId = ? ORDER BY CreatedAt DESC LIMIT 50';
      params = [userId];
    } else if (userType === 'agent') {
      query = 'SELECT * FROM Notifications WHERE AgentId = ? ORDER BY CreatedAt DESC LIMIT 50';
      params = [userId];
    } else {
      query = 'SELECT * FROM Notifications WHERE UserId = ? ORDER BY CreatedAt DESC LIMIT 50';
      params = [userId];
    }
    
    const notifications = await getAll(query, params);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    let query;
    let params;
    
    if (userType === 'admin') {
      query = 'SELECT COUNT(*) as count FROM Notifications WHERE AdminId = ? AND IsRead = 0';
      params = [userId];
    } else if (userType === 'agent') {
      query = 'SELECT COUNT(*) as count FROM Notifications WHERE AgentId = ? AND IsRead = 0';
      params = [userId];
    } else {
      query = 'SELECT COUNT(*) as count FROM Notifications WHERE UserId = ? AND IsRead = 0';
      params = [userId];
    }
    
    const result = await getOne(query, params);
    
    res.json({
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const userType = req.user.userType;
    
    // Verify notification belongs to user
    const notification = await getOne('SELECT * FROM Notifications WHERE Id = ?', [notificationId]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check ownership
    const isOwner = (userType === 'admin' && notification.AdminId === userId) ||
                    (userType === 'agent' && notification.AgentId === userId) ||
                    (userType === 'user' && notification.UserId === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Mark as read
    await runQuery('UPDATE Notifications SET IsRead = 1 WHERE Id = ?', [notificationId]);
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    
    let query;
    let params;
    
    if (userType === 'admin') {
      query = 'UPDATE Notifications SET IsRead = 1 WHERE AdminId = ? AND IsRead = 0';
      params = [userId];
    } else if (userType === 'agent') {
      query = 'UPDATE Notifications SET IsRead = 1 WHERE AgentId = ? AND IsRead = 0';
      params = [userId];
    } else {
      query = 'UPDATE Notifications SET IsRead = 1 WHERE UserId = ? AND IsRead = 0';
      params = [userId];
    }
    
    await runQuery(query, params);
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const userType = req.user.userType;
    
    // Verify notification belongs to user
    const notification = await getOne('SELECT * FROM Notifications WHERE Id = ?', [notificationId]);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check ownership
    const isOwner = (userType === 'admin' && notification.AdminId === userId) ||
                    (userType === 'agent' && notification.AgentId === userId) ||
                    (userType === 'user' && notification.UserId === userId);
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Delete notification
    await runQuery('DELETE FROM Notifications WHERE Id = ?', [notificationId]);
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Create notification (internal use / webhook)
router.post('/create', async (req, res) => {
  try {
    const { userId, agentId, adminId, type, title, message, link } = req.body;
    
    // Validate required fields
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and message are required'
      });
    }
    
    // At least one recipient must be specified
    if (!userId && !agentId && !adminId) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient (userId, agentId, or adminId) is required'
      });
    }
    
    // Insert notification
    const result = await runQuery(
      'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [userId || null, agentId || null, adminId || null, type, title, message, link || null]
    );
    
    const notification = await getOne('SELECT * FROM Notifications WHERE Id = ?', [result.id]);
    
    // Emit real-time notification
    if (userId) emitNotification(userId, notification);
    if (agentId) emitNotification(agentId, notification);
    if (adminId) emitNotification(adminId, notification);
    
    res.status(201).json({
      success: true,
      message: 'Notification created',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
});

module.exports = router;
