const jwt = require("jsonwebtoken")
const crypto = require("crypto")

// Token expiration times
const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: process.env.JWT_ACCESS_EXPIRES || "1h", // 1 hour for access tokens
  REFRESH_TOKEN: process.env.JWT_REFRESH_EXPIRES || "7d", // 7 days for refresh tokens
  TEAM_MEMBER_ACCESS: process.env.JWT_TEAM_ACCESS_EXPIRES || "24h", // 24 hours for team members
  TEAM_MEMBER_REFRESH: process.env.JWT_TEAM_REFRESH_EXPIRES || "30d" // 30 days for team members
}

// Generate secure tokens with appropriate expiration
const generateTokens = (userId, userRole = 'head-chef') => {
  // Use different expiration times based on user role
  const accessExpiration = userRole === 'team-member' 
    ? TOKEN_EXPIRATION.TEAM_MEMBER_ACCESS 
    : TOKEN_EXPIRATION.ACCESS_TOKEN;
    
  const refreshExpiration = userRole === 'team-member'
    ? TOKEN_EXPIRATION.TEAM_MEMBER_REFRESH
    : TOKEN_EXPIRATION.REFRESH_TOKEN;

  // Generate a unique token ID for tracking
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  // Add additional claims for security
  const accessTokenPayload = {
    userId,
    tokenId,
    type: 'access',
    role: userRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + getExpirationInSeconds(accessExpiration)
  };

  const refreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
    role: userRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + getExpirationInSeconds(refreshExpiration)
  };

  const accessToken = jwt.sign(
    accessTokenPayload, 
    process.env.JWT_SECRET || "your-secret-key", 
    { 
      expiresIn: accessExpiration,
      algorithm: 'HS256'
    }
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload, 
    process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key", 
    { 
      expiresIn: refreshExpiration,
      algorithm: 'HS256'
    }
  );

  return { 
    accessToken, 
    refreshToken, 
    tokenId,
    expiresIn: getExpirationInSeconds(accessExpiration)
  };
};

// Generate tokens specifically for team members
const generateTeamMemberTokens = (userId) => {
  return generateTokens(userId, 'team-member');
};

// Generate tokens for head chefs
const generateHeadChefTokens = (userId) => {
  return generateTokens(userId, 'head-chef');
};

// Verify token with additional security checks
const verifyToken = (token, secret, options = {}) => {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      ...options
    });
    
    // Additional security checks
    if (!decoded.userId || !decoded.tokenId || !decoded.type) {
      throw new Error('Invalid token structure');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

// Verify access token
const verifyAccessToken = (token) => {
  return verifyToken(token, process.env.JWT_SECRET || "your-secret-key");
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return verifyToken(token, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key");
};

// Refresh access token using refresh token
const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    // Generate new access token
    const newTokens = generateTokens(decoded.userId, decoded.role);
    
    return {
      accessToken: newTokens.accessToken,
      refreshToken: refreshToken, // Keep the same refresh token
      tokenId: newTokens.tokenId,
      expiresIn: newTokens.expiresIn
    };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Get expiration time in seconds
const getExpirationInSeconds = (expiration) => {
  const units = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  const match = expiration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default to 1 hour
  }
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
};

// Check if token is about to expire (within 5 minutes)
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return false;
    
    const fiveMinutes = 5 * 60; // 5 minutes in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    return (decoded.exp - currentTime) <= fiveMinutes;
  } catch (error) {
    return false;
  }
};

// Invalidate token (for logout)
const invalidateToken = (tokenId) => {
  // In production, you would add this token ID to a blacklist
  // For now, we'll just log the invalidation
  console.log(`Token ${tokenId} invalidated`);
  return true;
};

module.exports = {
  generateTokens,
  generateTeamMemberTokens,
  generateHeadChefTokens,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  refreshAccessToken,
  isTokenExpiringSoon,
  invalidateToken,
  TOKEN_EXPIRATION
};
