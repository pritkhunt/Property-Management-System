const express = require('express');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await getAll('SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, IsLogin, Status, CreatedAt, LastLoginAt FROM Users');
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get users statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await getOne('SELECT COUNT(*) as count FROM Users');
    const buyers = await getOne("SELECT COUNT(*) as count FROM Users WHERE Role = 'buyer'");
    const sellers = await getOne("SELECT COUNT(*) as count FROM Users WHERE Role = 'seller'");
    const activeUsers = await getOne('SELECT COUNT(*) as count FROM Users WHERE IsLogin = 1');
    
    res.json({
      success: true,
      data: {
        totalUsers: totalUsers.count,
        buyers: buyers.count,
        sellers: sellers.count,
        activeUsers: activeUsers.count
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

// Get sellers (users with role 'seller' or 'both')
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await getAll(
      "SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, usercode, IsLogin, CreatedAt, LastLoginAt FROM Users WHERE Role = 'seller' OR Role = 'both' ORDER BY Name ASC"
    );
    
    res.json({
      success: true,
      data: sellers
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers',
      error: error.message
    });
  }
});

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    if (!['buyer', 'seller'].includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be buyer or seller'
      });
    }
    
    const users = await getAll(
      'SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, IsLogin, CreatedAt, LastLoginAt FROM Users WHERE Role = ?',
      [role.toLowerCase()]
    );
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by role',
      error: error.message
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await getOne(
      'SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, IsLogin, CreatedAt, LastLoginAt FROM Users WHERE Id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { Name, MobileNo, ProfilePic } = req.body;
    
    // Check if user exists
    const user = await getOne('SELECT * FROM Users WHERE Id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (Name) {
      updates.push('Name = ?');
      values.push(Name);
    }
    if (MobileNo) {
      updates.push('MobileNo = ?');
      values.push(MobileNo);
    }
    if (ProfilePic) {
      updates.push('ProfilePic = ?');
      values.push(ProfilePic);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(id);
    
    await runQuery(
      `UPDATE Users SET ${updates.join(', ')} WHERE Id = ?`,
      values
    );
    
    // Get updated user
    const updatedUser = await getOne(
      'SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, IsLogin, CreatedAt, LastLoginAt FROM Users WHERE Id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// Suspend/Unsuspend user
router.post('/:id/suspend', async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend } = req.body; // true to suspend, false to unsuspend
    
    // Check if user exists
    const user = await getOne('SELECT * FROM Users WHERE Id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user status - Set Status field and IsLogin to 0 when suspending
    if (suspend) {
      await runQuery('UPDATE Users SET Status = ?, IsLogin = 0 WHERE Id = ?', ['suspended', id]);
    } else {
      await runQuery('UPDATE Users SET Status = ? WHERE Id = ?', ['inactive', id]);
    }
    
    res.json({
      success: true,
      message: suspend ? 'User suspended successfully' : 'User unsuspended successfully',
      data: {
        id,
        suspended: suspend
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
      error: error.message
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await getOne('SELECT * FROM Users WHERE Id = ?', [id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete associated OTPs
    await runQuery('DELETE FROM OTPs WHERE UserId = ?', [id]);
    
    // Delete user
    await runQuery('DELETE FROM Users WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

module.exports = router;
