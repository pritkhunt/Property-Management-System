const { verifyToken } = require('../utils/jwt');
const { getOne } = require('../config/database');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user/agent/admin exists and is logged in
    let user;
    if (decoded.userType === 'admin') {
      user = await getOne('SELECT * FROM Admins WHERE Id = ? AND IsActive = 1', [decoded.id]);
    } else if (decoded.userType === 'agent') {
      user = await getOne('SELECT * FROM Agents WHERE Id = ?', [decoded.id]);
    } else {
      user = await getOne('SELECT * FROM Users WHERE Id = ? AND IsLogin = 1', [decoded.id]);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication credentials'
      });
    }
    
    // Attach user to request
    req.user = {
      id: user.Id,
      email: user.Email,
      role: user.Role,
      userType: decoded.userType
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
