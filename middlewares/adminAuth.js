const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

// Middleware to check if user is authenticated AND has admin role
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Access denied. User not found.' });
    }

    // Check if user has super-admin role
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        message: 'Access denied. Super Admin privileges required.',
        userRole: user.role 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = adminAuth;