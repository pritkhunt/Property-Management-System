const express = require('express');
const { getAll } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get chat history between current user and another user/agent
router.get('/history/:otherId', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserType = req.user.userType;
    const otherId = req.params.otherId;
    
    // Determine the type of the other person based on current user type
    // If current is user, other is agent. If current is agent, other is user.
    // (This logic might need adjustment if we allow user-user or agent-agent chat later)
    const otherType = currentUserType === 'user' ? 'agent' : 'user';

    const query = `
      SELECT * FROM Messages 
      WHERE 
        (SenderId = ? AND SenderType = ? AND ReceiverId = ? AND ReceiverType = ?)
        OR 
        (SenderId = ? AND SenderType = ? AND ReceiverId = ? AND ReceiverType = ?)
      ORDER BY CreatedAt ASC
    `;

    const messages = await getAll(query, [
      currentUserId, currentUserType, otherId, otherType,
      otherId, otherType, currentUserId, currentUserType
    ]);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
});

// Get list of conversations (people the current user has chatted with)
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUserType = req.user.userType;
    
    // We need to find unique pairs. 
    // If current user is 'user', we want distinct Agents they talked to.
    // If current user is 'agent', we want distinct Users they talked to.
    
    let query;
    if (currentUserType === 'user') {
      // Find agents this user has exchanged messages with
      query = `
        SELECT DISTINCT 
          a.Id, a.Name, a.Email, a.ProfilePic,
          (SELECT Message FROM Messages m2 
           WHERE (m2.SenderId = ? AND m2.SenderType = 'user' AND m2.ReceiverId = a.Id AND m2.ReceiverType = 'agent')
              OR (m2.SenderId = a.Id AND m2.SenderType = 'agent' AND m2.ReceiverId = ? AND m2.ReceiverType = 'user')
           ORDER BY m2.CreatedAt DESC LIMIT 1) as LastMessage,
          (SELECT CreatedAt FROM Messages m3
           WHERE (m3.SenderId = ? AND m3.SenderType = 'user' AND m3.ReceiverId = a.Id AND m3.ReceiverType = 'agent')
              OR (m3.SenderId = a.Id AND m3.SenderType = 'agent' AND m3.ReceiverId = ? AND m3.ReceiverType = 'user')
           ORDER BY m3.CreatedAt DESC LIMIT 1) as LastMessageTime
        FROM Agents a
        JOIN Messages m ON (m.SenderId = a.Id AND m.SenderType = 'agent' AND m.ReceiverId = ? AND m.ReceiverType = 'user')
                        OR (m.SenderId = ? AND m.SenderType = 'user' AND m.ReceiverId = a.Id AND m.ReceiverType = 'agent')
        ORDER BY LastMessageTime DESC
      `;
    } else {
      // Find users this agent has exchanged messages with
      query = `
        SELECT DISTINCT 
          u.Id, u.Name, u.Email, u.ProfilePic,
          (SELECT Message FROM Messages m2 
           WHERE (m2.SenderId = ? AND m2.SenderType = 'agent' AND m2.ReceiverId = u.Id AND m2.ReceiverType = 'user')
              OR (m2.SenderId = u.Id AND m2.SenderType = 'user' AND m2.ReceiverId = ? AND m2.ReceiverType = 'agent')
           ORDER BY m2.CreatedAt DESC LIMIT 1) as LastMessage,
          (SELECT CreatedAt FROM Messages m3
           WHERE (m3.SenderId = ? AND m3.SenderType = 'agent' AND m3.ReceiverId = u.Id AND m3.ReceiverType = 'user')
              OR (m3.SenderId = u.Id AND m3.SenderType = 'user' AND m3.ReceiverId = ? AND m3.ReceiverType = 'agent')
           ORDER BY m3.CreatedAt DESC LIMIT 1) as LastMessageTime
        FROM Users u
        JOIN Messages m ON (m.SenderId = u.Id AND m.SenderType = 'user' AND m.ReceiverId = ? AND m.ReceiverType = 'agent')
                        OR (m.SenderId = ? AND m.SenderType = 'agent' AND m.ReceiverId = u.Id AND m.ReceiverType = 'user')
        ORDER BY LastMessageTime DESC
      `;
    }

    const conversations = await getAll(query, [
      currentUserId, currentUserId, 
      currentUserId, currentUserId,
      currentUserId, currentUserId
    ]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: error.message
    });
  }
});

module.exports = router;
