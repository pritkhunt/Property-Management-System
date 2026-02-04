const express = require('express');
const { runQuery, getOne, getAll } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { emitToAdmins, emitNotification } = require('../config/socket');
const { uploadProfile } = require('../middleware/upload');

const router = express.Router();

// Public endpoint - Get top agents (no auth required)
router.get('/top', async (req, res) => {
  try {
    const agents = await getAll(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, Age, Gender, 
       City, State, Status FROM Agents WHERE Status = 'approved' LIMIT 4`
    );
    
    res.json({
      success: true,
      data: {
        agents: agents
      }
    });
  } catch (error) {
    console.error('Get top agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top agents',
      error: error.message
    });
  }
});

// Get agent statistics (must be before /:id route to avoid collision)
router.get('/stats', async (req, res) => {
  try {
    const totalAgents = await getOne('SELECT COUNT(*) as count FROM Agents');
    const pending = await getOne("SELECT COUNT(*) as count FROM Agents WHERE Status = 'pending'");
    const approved = await getOne("SELECT COUNT(*) as count FROM Agents WHERE Status = 'approved'");
    const rejected = await getOne("SELECT COUNT(*) as count FROM Agents WHERE Status = 'rejected'");
    
    res.json({
      success: true,
      data: {
        totalAgents: totalAgents.count,
        pending: pending.count,
        approved: approved.count,
        rejected: rejected.count
      }
    });
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent statistics',
      error: error.message
    });
  }
});

// Get all approved agents with property counts (Public endpoint - no auth required)
router.get('/', async (req, res) => {
  try {
    // Get approved agents with property counts (for public viewing)
    const agents = await getAll(
      `SELECT 
        a.Id, a.Name, a.Email, a.MobileNo, a.ProfilePic, a.PublicUrl, 
        a.Age, a.Gender, a.City, a.State, a.Status,
        COUNT(DISTINCT p.Id) as PropertyCount
       FROM Agents a
       LEFT JOIN Properties p ON a.Id = p.AgentId AND p.Status = 'active'
       WHERE a.Status = 'approved'
       GROUP BY a.Id
       ORDER BY PropertyCount DESC, a.Date DESC`
    );
    
    // Map to frontend expected format with full image URLs
    const mappedAgents = agents.map(agent => {
      // Construct full URL for profile picture
      let profilepic = null;
      if (agent.ProfilePic) {
        if (agent.ProfilePic.startsWith('http')) {
          profilepic = agent.ProfilePic;
        } else {
          const cleanPath = agent.ProfilePic.startsWith('/') ? agent.ProfilePic : '/' + agent.ProfilePic;
          profilepic = `http://localhost:5000${cleanPath}`;
        }
      }
      
      return {
        id: agent.Id,
        name: agent.Name,
        email: agent.Email,
        mobileno: agent.MobileNo,
        profilepic: profilepic,
        publicUrl: agent.PublicUrl,
        age: agent.Age,
        gender: agent.Gender,
        city: agent.City,
        state: agent.State,
        status: agent.Status,
        propertyCount: agent.PropertyCount || 0,
        rating: 4.5,
        totalReviews: 0,
        specialization: 'Real Estate Professional'
      };
    });
    
    res.json({
      success: true,
      data: mappedAgents
    });
  } catch (error) {
    console.error('Get all agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
});

// Get agent by ID with property count (Public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const agent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, Age, Gender, 
       City, State, Address, Status, Date FROM Agents WHERE Id = ?`,
      [id]
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get property count for this agent
    const propertyCountResult = await getOne(
      'SELECT COUNT(*) as count FROM Properties WHERE AgentId = ? AND Status = "active"',
      [id]
    );
    
    // Construct full URL for profile picture
    let profilepic = null;
    if (agent.ProfilePic) {
      if (agent.ProfilePic.startsWith('http')) {
        profilepic = agent.ProfilePic;
      } else {
        const cleanPath = agent.ProfilePic.startsWith('/') ? agent.ProfilePic : '/' + agent.ProfilePic;
        profilepic = `http://localhost:5000${cleanPath}`;
      }
    }
    
    console.log('🖼️  Agent profile pic:', {
      agentId: agent.Id,
      rawProfilePic: agent.ProfilePic,
      fullURL: profilepic
    });
    
    // Map to frontend format
    const mappedAgent = {
      id: agent.Id,
      name: agent.Name,
      email: agent.Email,
      mobileno: agent.MobileNo,
      profilepic: profilepic,
      publicUrl: agent.PublicUrl,
      age: agent.Age,
      gender: agent.Gender,
      city: agent.City,
      state: agent.State,
      address: agent.Address,
      status: agent.Status,
      propertyCount: propertyCountResult?.count || 0,
      rating: 4.5, // TODO: Implement reviews system
      totalReviews: 0, // TODO: Implement reviews system
      experience: '5+ years', // TODO: Add to database
      specialization: 'Real Estate Professional', // TODO: Add to database
      languages: 'English, Hindi', // TODO: Add to database
      description: 'Experienced real estate professional dedicated to helping clients find their perfect property.',
      achievements: [] // TODO: Add to database
    };
    
    res.json({
      success: true,
      data: mappedAgent
    });
  } catch (error) {
    console.error('Get agent by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent',
      error: error.message
    });
  }
});

// Get agent's properties (Public endpoint)
router.get('/:id/properties', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify agent exists
    const agent = await getOne('SELECT Id FROM Agents WHERE Id = ?', [id]);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Get agent's properties with images
    const properties = await getAll(
      `SELECT 
        p.Id, p.Title, p.Description, p.Address, p.City, p.State, 
        p.Price, p.Size, p.Bedrooms, p.Bathrooms, p.PropertyType, p.ListingType,
        p.Furnishing, p.Status, p.MainImage, p.CreatedAt
       FROM Properties p
       WHERE p.AgentId = ? AND p.Status = 'active'
       ORDER BY p.CreatedAt DESC`,
      [id]
    );
    
    // Map to frontend format
    const mappedProperties = properties.map(prop => ({
      id: prop.Id,
      title: prop.Title,
      description: prop.Description,
      address: prop.Address,
      city: prop.City,
      state: prop.State,
      price: prop.Price,
      size: prop.Size,
      bedrooms: prop.Bedrooms,
      bathrooms: prop.Bathrooms,
      propertyType: prop.PropertyType,
      type: prop.ListingType,
      furnishing: prop.Furnishing,
      status: prop.Status,
      propertyImage: prop.MainImage ? (prop.MainImage.startsWith('http') ? prop.MainImage : `http://localhost:5000${prop.MainImage}`) : null,
      createdAt: prop.CreatedAt
    }));
    
    res.json({
      success: true,
      data: {
        properties: mappedProperties
      }
    });
  } catch (error) {
    console.error('Get agent properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent properties',
      error: error.message
    });
  }
});

// Admin endpoint - Get all agents for admin dashboard (no status filter)
router.get('/admin/all', async (req, res) => {
  try {
    // Get ALL agents with property counts (for admin review)
    const agents = await getAll(
      `SELECT 
        a.Id, a.Name, a.Email, a.MobileNo, a.ProfilePic, a.PublicUrl, 
        a.Age, a.Gender, a.City, a.State, a.Status,
        COUNT(DISTINCT p.Id) as PropertyCount
       FROM Agents a
       LEFT JOIN Properties p ON a.Id = p.AgentId AND p.Status = 'active'
       GROUP BY a.Id
       ORDER BY a.Date DESC`
    );
    
    // Map to frontend expected format with full image URLs
    const mappedAgents = agents.map(agent => {
      // Construct full URL for profile picture
      let profilepic = null;
      if (agent.ProfilePic) {
        if (agent.ProfilePic.startsWith('http')) {
          profilepic = agent.ProfilePic;
        } else {
          const cleanPath = agent.ProfilePic.startsWith('/') ? agent.ProfilePic : '/' + agent.ProfilePic;
          profilepic = `http://localhost:5000${cleanPath}`;
        }
      }
      
      return {
        id: agent.Id,
        name: agent.Name,
        email: agent.Email,
        mobileno: agent.MobileNo,
        profilepic: profilepic,
        publicUrl: agent.PublicUrl,
        age: agent.Age,
        gender: agent.Gender,
        city: agent.City,
        state: agent.State,
        status: agent.Status,
        propertyCount: agent.PropertyCount || 0,
        rating: 4.5,
        totalReviews: 0,
        specialization: 'Real Estate Professional'
      };
    });
    
    res.json({
      success: true,
      data: mappedAgents
    });
  } catch (error) {
    console.error('Get all agents for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents',
      error: error.message
    });
  }
});

// All remaining routes require authentication
router.use(authenticate);

// Get current agent profile
router.get('/profile/me', async (req, res) => {
  try {
    const agentId = req.user.id;
    
    const agent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, usercode, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Id = ?`,
      [agentId]
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent profile not found'
      });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    console.error('Get agent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agent profile',
      error: error.message
    });
  }
});

// Update current agent profile
router.put('/profile/me', async (req, res) => {
  try {
    const agentId = req.user.id;
    
    // Only extract editable fields from request body
    // IMPORTANT: Email, UserCode, Status, and ProfilePic are NEVER updated via this endpoint
    // These fields are protected and can only be changed through specific routes:
    // - Email: Cannot be changed (identity field)
    // - UserCode: Cannot be changed (unique identifier, system-generated)
    // - Status: Only admins can change via status update endpoint
    // - ProfilePic: Only updated via upload-picture endpoint
    const {
      Name, MobileNo, Age, Gender,
      City, State, Address, BankName, BankAccountNo, IfscCode
    } = req.body;
    
    // Check if agent exists
    const agent = await getOne('SELECT * FROM Agents WHERE Id = ?', [agentId]);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (Name !== undefined) {
      updates.push('Name = ?');
      values.push(Name);
    }
    if (MobileNo !== undefined) {
      updates.push('MobileNo = ?');
      values.push(MobileNo);
    }
    if (Age !== undefined) {
      updates.push('Age = ?');
      values.push(Age);
    }
    if (Gender !== undefined) {
      updates.push('Gender = ?');
      values.push(Gender);
    }
    if (City !== undefined) {
      updates.push('City = ?');
      values.push(City);
    }
    if (State !== undefined) {
      updates.push('State = ?');
      values.push(State);
    }
    if (Address !== undefined) {
      updates.push('Address = ?');
      values.push(Address);
    }
    if (BankName !== undefined) {
      updates.push('BankName = ?');
      values.push(BankName);
    }
    if (BankAccountNo !== undefined) {
      updates.push('BankAccountNo = ?');
      values.push(BankAccountNo);
    }
    if (IfscCode !== undefined) {
      updates.push('IfscCode = ?');
      values.push(IfscCode);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(agentId);
    
    await runQuery(
      `UPDATE Agents SET ${updates.join(', ')} WHERE Id = ?`,
      values
    );
    
    // Get updated agent profile
    const updatedAgent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, usercode, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Id = ?`,
      [agentId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    console.error('Update agent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Upload agent profile picture
router.post('/profile/upload-picture', uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    const agentId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Build the file path
    const filePath = `/uploads/profile-pictures/${req.file.filename}`;
    
    // Update agent's profile picture in database
    await runQuery(
      'UPDATE Agents SET ProfilePic = ? WHERE Id = ?',
      [filePath, agentId]
    );
    
    // Get updated agent profile
    const updatedAgent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, usercode, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Id = ?`,
      [agentId]
    );
    
    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: updatedAgent,
      filePath: filePath
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
});



// Get agents by status
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    const agents = await getAll(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Status = ? 
       ORDER BY Date DESC`,
      [status.toLowerCase()]
    );
    
    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    console.error('Get agents by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch agents by status',
      error: error.message
    });
  }
});

// Update agent
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      Name, MobileNo, ProfilePic, Age, Gender,
      City, State, Address, BankName, BankAccountNo, IfscCode
    } = req.body;
    
    // Check if agent exists
    const agent = await getOne('SELECT * FROM Agents WHERE Id = ?', [id]);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
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
    if (Age) {
      updates.push('Age = ?');
      values.push(Age);
    }
    if (Gender) {
      updates.push('Gender = ?');
      values.push(Gender);
    }
    if (City) {
      updates.push('City = ?');
      values.push(City);
    }
    if (State) {
      updates.push('State = ?');
      values.push(State);
    }
    if (Address) {
      updates.push('Address = ?');
      values.push(Address);
    }
    if (BankName) {
      updates.push('BankName = ?');
      values.push(BankName);
    }
    if (BankAccountNo) {
      updates.push('BankAccountNo = ?');
      values.push(BankAccountNo);
    }
    if (IfscCode) {
      updates.push('IfscCode = ?');
      values.push(IfscCode);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(id);
    
    await runQuery(
      `UPDATE Agents SET ${updates.join(', ')} WHERE Id = ?`,
      values
    );
    
    // Get updated agent
    const updatedAgent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Id = ?`,
      [id]
    );
    
    res.json({
      success: true,
      message: 'Agent updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent',
      error: error.message
    });
  }
});

// Update agent status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { Status } = req.body;
    
    if (!Status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    if (!['pending', 'approved', 'rejected'].includes(Status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }
    
    // Check if agent exists
    const agent = await getOne('SELECT * FROM Agents WHERE Id = ?', [id]);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Update status
    await runQuery('UPDATE Agents SET Status = ? WHERE Id = ?', [Status.toLowerCase(), id]);
    
    // Get updated agent
    const updatedAgent = await getOne(
      `SELECT Id, Name, Email, MobileNo, ProfilePic, PublicUrl, Role, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, 
       AdharCardFront, PanCard, Status, Date FROM Agents WHERE Id = ?`,
      [id]
    );
    
    // Emit real-time update to admins
    emitToAdmins('agent_status_updated', updatedAgent);
    
    // Create notification for the agent
    if (Status.toLowerCase() === 'approved') {
      await runQuery(
        'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
        [null, id, null, 'agent_approved', 'Application Approved!', 
         'Your agent application has been approved. You can now start managing properties.', 
         '/agent/dashboard']
      );
      emitNotification(id, {
        type: 'agent_approved',
        title: 'Application Approved!',
        message: 'Your agent application has been approved. You can now start managing properties.',
        link: '/agent/dashboard'
      });
    } else if (Status.toLowerCase() === 'rejected') {
      await runQuery(
        'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
        [null, id, null, 'agent_rejected', 'Application Rejected', 
         'Unfortunately, your agent application has been rejected. Please contact support for more information.', 
         '/agent/dashboard']
      );
      emitNotification(id, {
        type: 'agent_rejected',
        title: 'Application Rejected',
        message: 'Unfortunately, your agent application has been rejected. Please contact support for more information.',
        link: '/agent/dashboard'
      });
    }
    
    res.json({
      success: true,
      message: 'Agent status updated successfully',
      data: updatedAgent
    });
  } catch (error) {
    console.error('Update agent status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update agent status',
      error: error.message
    });
  }
});

// Bulk approve agents
router.post('/bulk-approve', async (req, res) => {
  try {
    const { agentIds } = req.body;
    
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Agent IDs array is required'
      });
    }
    
    // Prepare placeholders for IN clause
    const placeholders = agentIds.map(() => '?').join(',');
    
    // Update all agents to approved
    await runQuery(
      `UPDATE Agents SET Status = 'approved' WHERE Id IN (${placeholders})`,
      agentIds
    );
    
    res.json({
      success: true,
      message: `${agentIds.length} agents approved successfully`
    });
  } catch (error) {
    console.error('Bulk approve agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve agents',
      error: error.message
    });
  }
});

// Delete agent
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if agent exists
    const agent = await getOne('SELECT * FROM Agents WHERE Id = ?', [id]);
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }
    
    // Delete associated OTPs
    await runQuery('DELETE FROM OTPs WHERE AgentId = ?', [id]);
    
    // Delete agent
    await runQuery('DELETE FROM Agents WHERE Id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Agent deleted successfully'
    });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete agent',
      error: error.message
    });
  }
});

module.exports = router;
