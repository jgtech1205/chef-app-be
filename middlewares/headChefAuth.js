const jwt = require('jsonwebtoken');
const User = require('../database/models/User');

// Middleware to check if user is authenticated AND has head-chef role
const headChefAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('restaurant').select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Access denied. User not found.' });
    }

    // Check if user has head-chef role
    if (user.role !== 'head-chef') {
      return res.status(403).json({ 
        message: 'Access denied. Head Chef privileges required.',
        userRole: user.role 
      });
    }

    // Check if head-chef has a restaurant
    if (!user.restaurant) {
      return res.status(403).json({ 
        message: 'Access denied. No restaurant associated with this head chef.' 
      });
    }

    req.user = user;
    req.restaurant = user.restaurant;
    next();
  } catch (error) {
    console.error('Head chef auth middleware error:', error);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = headChefAuth;