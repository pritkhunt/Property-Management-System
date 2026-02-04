const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getOne, getAll } = require('../config/database');
const { generateToken } = require('../utils/jwt');
const { generateOTP, getOTPExpiry, isOTPExpired } = require('../utils/otp');
const { sendOTPEmail, sendConfirmationEmail } = require('../utils/email');
const { authenticate } = require('../middleware/auth');
const { upload, uploadProfile } = require('../middleware/upload');
const { emitToAdmins, emitNotification } = require('../config/socket');
const { generateUserUserCode, generateAgentUserCode } = require('../utils/generateUserCode');

const router = express.Router();

// Register User (Buyer/Seller)
router.post('/register-user', async (req, res) => {
  try {
    const { Name, Email, MobileNo, Password, Role } = req.body;
    
    // Validate required fields
    if (!Name || !Email || !MobileNo || !Password || !Role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate role
    if (!['buyer', 'seller', 'both'].includes(Role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either buyer, seller, or both'
      });
    }
    
    // Check if user already exists
    const existingUser = await getOne('SELECT * FROM Users WHERE Email = ?', [Email]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);
    
    // Generate UserCode
    const userCode = await generateUserUserCode(Role.toLowerCase());
    
    // Default profile picture - using working placeholder
    const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(Name)}&background=3b82f6&color=fff&size=200`;
    
    // Insert user
    const result = await runQuery(
      'INSERT INTO Users (Name, Email, MobileNo, Password, ProfilePic, PublicUrl, Role, UserCode, IsLogin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)',
      [Name, Email, MobileNo, hashedPassword, defaultProfilePic, '', Role.toLowerCase(), userCode]
    );
    
    const userId = result.id;
    
    // Update PublicUrl
    await runQuery('UPDATE Users SET PublicUrl = ? WHERE Id = ?', [`/profile/user/${userId}`, userId]);
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();
    
    await runQuery(
      'INSERT INTO OTPs (Email, Otp, ExpiresAt, UserId, IsUsed) VALUES (?, ?, ?, ?, 0)',
      [Email, otp, expiresAt, userId]
    );
    
    // Send OTP email (don't wait for it)
    sendOTPEmail(Email, otp, Name).catch(err => console.error('Email error:', err));
    
    // Create welcome notification for the user
    await runQuery(
      'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [userId, null, null, 'user_welcome', 'Welcome to PropertyHub!', 
       `Hello ${Name}! Welcome to PropertyHub. Start exploring properties and find your dream home.`, 
       '/dashboard']
    );
    
    // Emit real-time notification to user (after OTP verification they'll see it)
    emitNotification(userId, {
      type: 'user_welcome',
      title: 'Welcome to PropertyHub!',
      message: `Hello ${Name}! Welcome to PropertyHub. Start exploring properties and find your dream home.`,
      link: '/dashboard'
    });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      data: {
        userId: userId,
        email: Email,
        requiresOTP: true
      }
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: error.message
    });
  }
});

// Register Agent
router.post('/register-agent', upload.fields([
  { name: 'AdharCardFront', maxCount: 1 },
  { name: 'PanCard', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      Name, Email, MobileNo, Password, Age, Gender,
      City, State, Address, BankName, BankAccountNo, IfscCode
    } = req.body;
    
    // Validate required fields
    if (!Name || !Email || !MobileNo || !Password || !Age || !Gender ||
        !City || !State || !Address || !BankName || !BankAccountNo || !IfscCode) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if agent already exists
    const existingAgent = await getOne('SELECT * FROM Agents WHERE Email = ? OR BankAccountNo = ?', 
      [Email, BankAccountNo]);
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: 'Agent with this email or bank account already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);
    
    // Generate UserCode for agent
    const userCode = await generateAgentUserCode();
    
    // Get uploaded file paths
    const adharCardPath = req.files?.AdharCardFront ? `/uploads/agent-documents/${req.files.AdharCardFront[0].filename}` : '';
    const panCardPath = req.files?.PanCard ? `/uploads/agent-documents/${req.files.PanCard[0].filename}` : '';
    const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(Name)}&background=10b981&color=fff&size=200`;
    
    // Insert agent
    const result = await runQuery(
      `INSERT INTO Agents (Name, Email, MobileNo, Password, ProfilePic, PublicUrl, Age, Gender, 
       City, State, Address, BankName, BankAccountNo, IfscCode, AdharCardFront, PanCard, UserCode, Status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [Name, Email, MobileNo, hashedPassword, defaultProfilePic, '', Age, Gender,
       City, State, Address, BankName, BankAccountNo, IfscCode, adharCardPath, panCardPath, userCode]
    );
    
    const agentId = result.id;
    
    // Update PublicUrl
    await runQuery('UPDATE Agents SET PublicUrl = ? WHERE Id = ?', [`/profile/agent/${agentId}`, agentId]);
    
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();
    
    await runQuery(
      'INSERT INTO OTPs (Email, Otp, ExpiresAt, AgentId, IsUsed) VALUES (?, ?, ?, ?, 0)',
      [Email, otp, expiresAt, agentId]
    );
    
    // Send OTP email (don't wait for it)
    sendOTPEmail(Email, otp, Name).catch(err => console.error('Email error:', err));
    
    // Get the newly created agent data
    const newAgent = await getOne(
      `SELECT Id, Name, Email, MobileNo, Age, Gender, City, State, Status, Date 
       FROM Agents WHERE Id = ?`,
      [agentId]
    );
    
    // Emit real-time event to admins
    emitToAdmins('new_agent_registration', newAgent);
    
    // Create welcome notification for the agent
    await runQuery(
      'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [null, agentId, null, 'agent_welcome', 'Welcome to PropertyHub!', 
       `Hello ${Name}! Your agent registration is pending approval. We'll notify you once your application is reviewed.`, 
       '/agent/dashboard']
    );
    
    // Emit real-time notification to agent (after OTP verification they'll see it)
    emitNotification(agentId, {
      type: 'agent_welcome',
      title: 'Welcome to PropertyHub!',
      message: `Hello ${Name}! Your agent registration is pending approval. We'll notify you once your application is reviewed.`,
      link: '/agent/dashboard'
    });
    
    // Create notification for all admins
    const admins = await getAll('SELECT Id FROM Admins');
    for (const admin of admins) {
      await runQuery(
        'INSERT INTO Notifications (UserId, AgentId, AdminId, Type, Title, Message, Link, IsRead) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
        [null, null, admin.Id, 'agent_registration', 'New Agent Registration', 
         `${Name} has registered as an agent and is awaiting approval.`, 
         '/admin/agents']
      );
      
      // Emit real-time notification to each admin
      emitNotification(admin.Id, {
        type: 'agent_registration',
        title: 'New Agent Registration',
        message: `${Name} has registered as an agent and is awaiting approval.`,
        link: '/admin/agents'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Agent registered successfully. Please verify your email with the OTP sent. Admin approval is required.',
      data: {
        agentId: agentId,
        email: Email,
        status: 'pending',
        requiresOTP: true
      }
    });
  } catch (error) {
    console.error('Register agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register agent',
      error: error.message
    });
  }
});

// Login - Checks Admins, Users, and Agents tables
router.post('/login', async (req, res) => {
  try {
    // Accept both capitalized and lowercase field names
    const Email = req.body.Email || req.body.email;
    const Password = req.body.Password || req.body.password;
    
    console.log('🔐 Login attempt for:', Email);
    
    if (!Email || !Password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    let user = null;
    let userType = null;
    let tableType = null;
    
    // Step 1: Check Admins table first
    try {
      user = await getOne('SELECT * FROM Admins WHERE Email = ?', [Email]);
      if (user) {
        tableType = 'Admins';
        userType = 'admin';
        console.log('✅ Found admin in Admins table:', Email);
      }
    } catch (error) {
      // Admins table might not exist yet
      console.log('⚠️  Admins table not found, checking Users table...');
    }
    
    // Step 2: If not found in Admins, check Users table (buyers, sellers)
    if (!user) {
      user = await getOne('SELECT * FROM Users WHERE Email = ?', [Email]);
      if (user) {
        tableType = 'Users';
        // Determine userType based on Role
        if (user.Role === 'buyer' || user.Role === 'seller') {
          userType = 'user'; // For frontend routing
          console.log('✅ Found user in Users table:', Email, '- Role:', user.Role);
        } else {
          userType = 'user';
          console.log('✅ Found user in Users table:', Email);
        }
      }
    }
    
    // Step 3: If not found in Users, check Agents table
    if (!user) {
      user = await getOne('SELECT * FROM Agents WHERE Email = ?', [Email]);
      if (user) {
        tableType = 'Agents';
        userType = 'agent';
        console.log('✅ Found agent in Agents table:', Email);
      }
    }
    
    // Step 4: User not found in any table
    if (!user) {
      console.log('❌ User not found in any table (Admins/Users/Agents):', Email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Step 4: Check if agent is approved
    if (userType === 'agent' && user.Status !== 'approved') {
      console.log('⚠️  Agent account pending approval:', Email);
      return res.status(403).json({
        success: false,
        message: `Your agent account is ${user.Status}. Please wait for admin approval.`
      });
    }
    
    // Step 5: Verify password
    console.log('🔑 Verifying password for:', Email);
    const isValidPassword = await bcrypt.compare(Password, user.Password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', Email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('✅ Password verified for:', Email);
    
    // Step 5.5: Check if user is suspended (for Users table)
    if (tableType === 'Users' && user.Status === 'suspended') {
      console.log('❌ User account is suspended:', Email);
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }
    
    // Step 6: Update login status (for Admins and Users, not Agents)
    if (tableType === 'Admins') {
      await runQuery('UPDATE Admins SET IsActive = 1, LastLoginAt = CURRENT_TIMESTAMP WHERE Id = ?', [user.Id]);
      console.log('✅ Updated login status for admin:', Email);
    } else if (tableType === 'Users') {
      await runQuery('UPDATE Users SET Status = ?, IsLogin = 1, LastLoginAt = CURRENT_TIMESTAMP WHERE Id = ?', ['active', user.Id]);
      console.log('✅ Updated login status for user:', Email);
    }
    
    // Step 7: Generate token
    const token = generateToken({
      id: user.Id,
      email: user.Email,
      role: user.Role,
      userType: userType
    });
    
    // Step 8: Prepare user data (exclude password)
    const { Password: _, ...userData } = user;
    
    // Add userType to response for frontend routing
    userData.userType = userType;
    userData.tableType = tableType;
    
    console.log('🎉 Login successful for:', Email, '- Type:', userType, '- Table:', tableType);
    
    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      userType: userType,
      user: userData
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    // Accept both capitalized and lowercase field names
    const Email = req.body.Email || req.body.email;
    const Otp = req.body.Otp || req.body.otp;
    
    if (!Email || !Otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Find OTP record
    const otpRecord = await getOne(
      'SELECT * FROM OTPs WHERE Email = ? AND Otp = ? AND IsUsed = 0 ORDER BY CreatedAt DESC LIMIT 1',
      [Email, Otp]
    );
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Check if OTP is expired
    if (isOTPExpired(otpRecord.ExpiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Mark OTP as used
    await runQuery('UPDATE OTPs SET IsUsed = 1 WHERE Id = ?', [otpRecord.Id]);
    
    // Get user/agent details
    let user, userType;
    if (otpRecord.UserId) {
      user = await getOne('SELECT * FROM Users WHERE Id = ?', [otpRecord.UserId]);
      userType = 'user';
      // Update login status
      await runQuery('UPDATE Users SET IsLogin = 1, LastLoginAt = CURRENT_TIMESTAMP WHERE Id = ?', [otpRecord.UserId]);
    } else if (otpRecord.AgentId) {
      user = await getOne('SELECT * FROM Agents WHERE Id = ?', [otpRecord.AgentId]);
      userType = 'agent';
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate token
    const token = generateToken({
      id: user.Id,
      email: user.Email,
      role: user.Role,
      userType: userType
    });
    
    // Send confirmation email (don't wait for it)
    sendConfirmationEmail(user.Email, user.Name, userType).catch(err => 
      console.error('Confirmation email error:', err)
    );
    
    // Prepare user data (exclude password)
    const { Password: _, ...userData } = user;
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
      userType: userType,
      user: userData
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
});

// Reset Password (after OTP verification)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔐 Password reset request for:', email);
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required'
      });
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Find user in Users or Agents table
    let user = await getOne('SELECT * FROM Users WHERE Email = ?', [email]);
    let tableName = 'Users';
    
    if (!user) {
      user = await getOne('SELECT * FROM Agents WHERE Email = ?', [email]);
      tableName = 'Agents';
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password in database
    await runQuery(
      `UPDATE ${tableName} SET Password = ? WHERE Email = ?`,
      [hashedPassword, email]
    );
    
    // Mark all OTPs for this email as used
    await runQuery('UPDATE OTPs SET IsUsed = 1 WHERE Email = ?', [email]);
    
    console.log('✅ Password reset successfully for:', email);
    
    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    // Accept both capitalized and lowercase field names
    const Email = req.body.Email || req.body.email;
    
    console.log('📧 Resend OTP request for:', Email);
    
    if (!Email) {
      console.log('❌ No email provided');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user or agent
    let user = await getOne('SELECT * FROM Users WHERE Email = ?', [Email]);
    let userId = null;
    let agentId = null;
    let isAgent = false;
    
    if (!user) {
      user = await getOne('SELECT * FROM Agents WHERE Email = ?', [Email]);
      if (user) {
        agentId = user.Id;
        isAgent = true;
        console.log('✅ Found agent with email:', Email);
      }
    } else {
      userId = user.Id;
      console.log('✅ Found user with email:', Email);
    }
    
    if (!user) {
      console.log('❌ User not found with email:', Email);
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry();
    
    console.log('🔢 Generated OTP:', otp, 'for', Email);
    
    // Mark old OTPs as used
    await runQuery('UPDATE OTPs SET IsUsed = 1 WHERE Email = ?', [Email]);
    console.log('✅ Marked old OTPs as used');
    
    // Insert new OTP with correct foreign key
    if (isAgent) {
      await runQuery(
        'INSERT INTO OTPs (Email, Otp, ExpiresAt, AgentId, IsUsed) VALUES (?, ?, ?, ?, 0)',
        [Email, otp, expiresAt, agentId]
      );
    } else {
      await runQuery(
        'INSERT INTO OTPs (Email, Otp, ExpiresAt, UserId, IsUsed) VALUES (?, ?, ?, ?, 0)',
        [Email, otp, expiresAt, userId]
      );
    }
    console.log('✅ Inserted new OTP into database');
    
    // Send OTP email
    try {
      await sendOTPEmail(Email, otp, user.Name);
      console.log('✅ OTP email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Email send failed but OTP saved:', emailError.message);
      // Continue anyway - user can check backend console for OTP
    }
    
    res.json({
      success: true,
      message: 'OTP sent successfully. Check your email or backend console for the OTP code.',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Show OTP in development
    });
  } catch (error) {
    console.error('❌ Resend OTP error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Update user login status
    if (req.user.userType === 'user') {
      await runQuery('UPDATE Users SET Status = ?, IsLogin = 0 WHERE Id = ?', ['inactive', req.user.id]);
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});

// Get Profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    let user;
    const userType = req.user.userType;

    console.log('👤 Get profile request:', { userId: req.user.id, userType });

    // Check appropriate table based on user type
    if (userType === 'admin') {
      user = await getOne('SELECT * FROM Admins WHERE Id = ?', [req.user.id]);
    } else if (userType === 'agent') {
      user = await getOne('SELECT * FROM Agents WHERE Id = ?', [req.user.id]);
    } else {
      user = await getOne('SELECT * FROM Users WHERE Id = ?', [req.user.id]);
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Exclude password
    const { Password: _, ...userData } = user;
    
    // Add userType for frontend routing consistency
    userData.userType = userType;
    
    console.log('✅ Profile retrieved:', { id: userData.Id, name: userData.Name, userType });

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, mobileno, address, city, state, bio } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType;

    console.log('📝 Profile update request:', { userId, userType, data: req.body });

    // Build update query based on user type
    let updateQuery;
    let params = [];
    let tableName;

    if (userType === 'admin') {
      tableName = 'Admins';
    } else if (userType === 'agent') {
      tableName = 'Agents';
    } else {
      tableName = 'Users';
    }

    // Build dynamic update fields
    const updates = [];
    if (name) {
      updates.push('Name = ?');
      params.push(name);
    }
    if (mobileno) {
      updates.push('MobileNo = ?');
      params.push(mobileno);
    }
    if (address !== undefined) {
      updates.push('Address = ?');
      params.push(address);
    }
    if (city !== undefined) {
      updates.push('City = ?');
      params.push(city);
    }
    if (state !== undefined) {
      updates.push('State = ?');
      params.push(state);
    }
    if (bio !== undefined) {
      updates.push('Bio = ?');
      params.push(bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add userId to params
    params.push(userId);

    // Execute update
    updateQuery = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE Id = ?`;
    await runQuery(updateQuery, params);

    // Get updated user data
    let updatedUser;
    if (userType === 'agent') {
      updatedUser = await getOne('SELECT * FROM Agents WHERE Id = ?', [userId]);
    } else if (userType === 'admin') {
      updatedUser = await getOne('SELECT * FROM Admins WHERE Id = ?', [userId]);
    } else {
      updatedUser = await getOne('SELECT * FROM Users WHERE Id = ?', [userId]);
    }

    // Exclude password
    const { Password: _, ...userData } = updatedUser;

    // CRITICAL: Add userType and tableType for frontend routing
    // Without these, ProtectedRoute will redirect user to home page
    userData.userType = userType;
    userData.tableType = tableName;

    console.log('✅ Profile updated successfully:', userData);
    console.log('   UserType:', userType, '| TableType:', tableName);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Update password
router.put('/profile/update-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userType = req.user.userType;

    console.log('🔐 Password update request for userId:', userId, 'userType:', userType);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Determine table based on user type
    let tableName;
    if (userType === 'admin') {
      tableName = 'Admins';
    } else if (userType === 'agent') {
      tableName = 'Agents';
    } else {
      tableName = 'Users';
    }

    // Get current user with password
    let user;
    if (userType === 'agent') {
      user = await getOne('SELECT * FROM Agents WHERE Id = ?', [userId]);
    } else if (userType === 'admin') {
      user = await getOne('SELECT * FROM Admins WHERE Id = ?', [userId]);
    } else {
      user = await getOne('SELECT * FROM Users WHERE Id = ?', [userId]);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // CRITICAL: Verify current password
    console.log('🔑 Verifying current password...');
    const isValidPassword = await bcrypt.compare(currentPassword, user.Password);
    
    if (!isValidPassword) {
      console.log('❌ Current password is incorrect');
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    console.log('✅ Current password verified');

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await runQuery(
      `UPDATE ${tableName} SET Password = ? WHERE Id = ?`,
      [hashedPassword, userId]
    );

    console.log('✅ Password updated successfully for userId:', userId);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
});

// Upload profile picture
router.post('/profile/upload-picture', authenticate, uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const userType = req.user.userType;
    const profilePicPath = `/uploads/profile-pictures/${req.file.filename}`;

    console.log('📸 Profile picture upload:', { userId, userType, file: req.file.filename });

    // Determine table based on user type
    let tableName;
    if (userType === 'admin') {
      tableName = 'Admins';
    } else if (userType === 'agent') {
      tableName = 'Agents';
    } else {
      tableName = 'Users';
    }

    // Update ProfilePic in database
    await runQuery(
      `UPDATE ${tableName} SET ProfilePic = ? WHERE Id = ?`,
      [profilePicPath, userId]
    );

    // Get updated user data
    let updatedUser;
    if (userType === 'agent') {
      updatedUser = await getOne('SELECT * FROM Agents WHERE Id = ?', [userId]);
    } else if (userType === 'admin') {
      updatedUser = await getOne('SELECT * FROM Admins WHERE Id = ?', [userId]);
    } else {
      updatedUser = await getOne('SELECT * FROM Users WHERE Id = ?', [userId]);
    }

    // Exclude password
    const { Password: _, ...userData } = updatedUser;

    // CRITICAL: Add userType and tableType for frontend routing
    userData.userType = userType;
    userData.tableType = tableName;

    console.log('✅ Profile picture uploaded successfully:', profilePicPath);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePic: profilePicPath,
      user: userData
    });
  } catch (error) {
    console.error('❌ Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
});

module.exports = router;
