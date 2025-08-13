const rateLimit = require('express-rate-limit');

// In-memory store for rate limiting (use Redis in production)
const loginAttempts = new Map();

// Clean up old entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.timestamp > 15 * 60 * 1000) { // 15 minutes
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// Rate limiter for login-by-name endpoint
const loginByNameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
    error: "rate_limit_exceeded"
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as key
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    
    res.status(429).json({
      message: "Too many login attempts. Please try again in 15 minutes.",
      error: "rate_limit_exceeded"
    });
  }
});

// Custom rate limiter for tracking login attempts
const trackLoginAttempts = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `login_${ip}`;
  
  if (!loginAttempts.has(key)) {
    loginAttempts.set(key, {
      count: 0,
      timestamp: Date.now(),
      blocked: false
    });
  }
  
  const data = loginAttempts.get(key);
  
  // Check if IP is blocked
  if (data.blocked) {
    const timeSinceBlock = Date.now() - data.timestamp;
    if (timeSinceBlock < 15 * 60 * 1000) { // 15 minutes
      return res.status(429).json({
        message: "Too many failed login attempts. Please try again in 15 minutes.",
        error: "account_locked"
      });
    } else {
      // Reset after 15 minutes
      data.count = 0;
      data.blocked = false;
      data.timestamp = Date.now();
    }
  }
  
  req.loginAttempts = data;
  next();
};

// Reset login attempts on successful login
const resetLoginAttempts = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `login_${ip}`;
  
  if (loginAttempts.has(key)) {
    loginAttempts.delete(key);
  }
  
  next();
};

// Increment failed login attempts
const incrementFailedAttempts = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const key = `login_${ip}`;
  
  if (loginAttempts.has(key)) {
    const data = loginAttempts.get(key);
    data.count++;
    
    // Block after 5 failed attempts
    if (data.count >= 5) {
      data.blocked = true;
      data.timestamp = Date.now();
      console.warn(`IP ${ip} blocked due to 5 failed login attempts`);
    }
  }
  
  next();
};

module.exports = {
  loginByNameLimiter,
  trackLoginAttempts,
  resetLoginAttempts,
  incrementFailedAttempts
};
