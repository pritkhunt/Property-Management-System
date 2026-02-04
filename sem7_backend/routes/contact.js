const express = require('express');
const { runQuery, getAll, getOne } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/contact - Submit a contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, subject, message)'
      });
    }

    const result = await runQuery(
      `INSERT INTO ContactMessages (Name, Email, Phone, Subject, Message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone, subject, message]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: result.id
      }
    });
  } catch (error) {
    console.error('Error sending contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
});

// GET /api/contact - Get all messages (Admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const messages = await getAll('SELECT * FROM ContactMessages ORDER BY CreatedAt DESC');

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message
    });
  }
});

// DELETE /api/contact/:id - Delete a message (Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { id } = req.params;
    await runQuery('DELETE FROM ContactMessages WHERE Id = ?', [id]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
      error: error.message
    });
  }
});

module.exports = router;
