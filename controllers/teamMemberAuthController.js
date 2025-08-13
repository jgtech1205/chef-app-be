const { validationResult } = require("express-validator")
const User = require("../database/models/User")
const Restaurant = require("../database/models/Restaurant")
const { generateTeamMemberTokens } = require("../utils/tokenUtils")
const { sanitizeLoginByNameInputs } = require("../utils/inputValidation")
const { 
  logLoginAttempt, 
  updateLoginAttempts, 
  resetLoginAttempts,
  logSecurityEvent 
} = require("../utils/securityLogger")

const teamMemberAuthController = {
  // Team member login with first name as username and last name as password
  async loginTeamMember(req, res) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    try {
      const { restaurantName, username, password } = req.body;

      // Validate input - 400 errors
      if (!restaurantName || typeof restaurantName !== 'string' || restaurantName.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName: restaurantName || 'unknown',
          firstName: username || 'unknown',
          lastName: password || 'unknown',
          success: false,
          error: 'missing_restaurant_name',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName || 'unknown', false);
        
        return res.status(400).json({ 
          message: "Restaurant name is required",
          error: "missing_restaurant_name"
        });
      }

      if (!username || typeof username !== 'string' || username.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username || 'unknown',
          lastName: password || 'unknown',
          success: false,
          error: 'missing_username',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(400).json({ 
          message: "First name (username) is required",
          error: "missing_username"
        });
      }

      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password || 'unknown',
          success: false,
          error: 'missing_password',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(400).json({ 
          message: "Last name (password) is required",
          error: "missing_password"
        });
      }

      // Convert restaurant name to slug for lookup
      const slug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Find restaurant by slug - 404 error
      const restaurant = await Restaurant.findOne({ 
        slug: slug, 
        isActive: true 
      });
      
      if (!restaurant) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'restaurant_not_found',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(404).json({ 
          message: "Restaurant not found",
          error: "restaurant_not_found"
        });
      }

      // Check if restaurant is active - 403 error
      if (restaurant.status === 'suspended' || restaurant.status === 'cancelled') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'restaurant_suspended',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Restaurant access is currently suspended",
          error: "restaurant_suspended"
        });
      }

      // Find team member by first name (username) and verify password (last name)
      const teamMember = await User.findOne({
        firstName: { $regex: new RegExp(`^${username}$`, 'i') },
        lastName: { $regex: new RegExp(`^${password}$`, 'i') },
        organization: restaurant.organizationId,
        role: 'team-member',
        isActive: true
      });

      if (!teamMember) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'invalid_credentials',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(401).json({ 
          message: "Invalid first name or last name",
          error: "invalid_credentials"
        });
      }

      // Check user status - 403 errors
      if (teamMember.status === 'pending') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'pending_approval',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Your access request is still pending approval. Please contact the restaurant manager.",
          error: "pending_approval",
          status: "pending"
        });
      }

      if (teamMember.status === 'rejected') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'access_rejected',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Your access request has been rejected. Please contact the restaurant manager.",
          error: "access_rejected",
          status: "rejected"
        });
      }

      if (teamMember.status !== 'active') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: username,
          lastName: password,
          success: false,
          error: 'account_inactive',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Account is not active",
          error: "account_inactive",
          status: teamMember.status
        });
      }

      // Update last login
      teamMember.lastLogin = new Date();
      await teamMember.save();

      // Generate secure tokens for team member
      const { accessToken, refreshToken, tokenId, expiresIn } = generateTeamMemberTokens(teamMember._id);

      // Log successful login
      logLoginAttempt({
        ip,
        restaurantName,
        firstName: username,
        lastName: password,
        success: true,
        userAgent
      });

      // Reset login attempts for successful login
      resetLoginAttempts(ip);

      // Log security event for successful login
      logSecurityEvent({
        type: 'SUCCESSFUL_LOGIN',
        ip,
        restaurantName,
        firstName: username,
        lastName: password,
        severity: 'INFO',
        details: {
          tokenId,
          userId: teamMember._id,
          role: teamMember.role
        }
      });

      res.json({
        user: {
          id: teamMember._id,
          email: teamMember.email,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          name: teamMember.name,
          role: teamMember.role,
          status: teamMember.status,
          permissions: teamMember.permissions,
          organization: teamMember.organization,
        },
        accessToken,
        refreshToken,
        expiresIn
      });
    } catch (error) {
      console.error("Team member login error:", error);
      
      // Log failed login attempt
      logLoginAttempt({
        ip,
        restaurantName: req.body?.restaurantName || 'unknown',
        firstName: req.body?.username || 'unknown',
        lastName: req.body?.password || 'unknown',
        success: false,
        error: 'server_error',
        userAgent
      });
      
      updateLoginAttempts(ip, req.body?.restaurantName || 'unknown', false);
      
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        error: "server_error"
      });
    }
  },

  // Team member login by name (legacy method)
  async loginByName(req, res) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    try {
      // Input validation and sanitization
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Log failed validation attempt
        logLoginAttempt({
          ip,
          restaurantName: req.body.restaurantName || 'unknown',
          firstName: req.body.firstName || 'unknown',
          lastName: req.body.lastName || 'unknown',
          success: false,
          error: 'validation_error',
          userAgent
        });
        
        updateLoginAttempts(ip, req.body.restaurantName || 'unknown', false);
        
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "validation_error",
          errors: errors.array() 
        });
      }

      const { restaurantName, firstName, lastName } = req.body;

      // Additional input validation - 400 errors
      if (!restaurantName || typeof restaurantName !== 'string' || restaurantName.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName: restaurantName || 'unknown',
          firstName,
          lastName,
          success: false,
          error: 'missing_restaurant_name',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName || 'unknown', false);
        
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "missing_fields"
        });
      }

      if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName: firstName || 'unknown',
          lastName,
          success: false,
          error: 'missing_first_name',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "invalid_first_name"
        });
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName: lastName || 'unknown',
          success: false,
          error: 'missing_last_name',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(400).json({ 
          message: "Please fill in both first name and last name",
          error: "invalid_last_name"
        });
      }

      // Convert restaurant name to slug for lookup
      const slug = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Find restaurant by slug - 404 error
      const restaurant = await Restaurant.findOne({ 
        slug: slug, 
        isActive: true 
      });
      
      if (!restaurant) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'restaurant_not_found',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(404).json({ 
          message: "Restaurant not found",
          error: "restaurant_not_found"
        });
      }

      // Check if restaurant is active - 403 error
      if (restaurant.status === 'suspended' || restaurant.status === 'cancelled') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'restaurant_suspended',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Restaurant access is currently suspended",
          error: "restaurant_suspended"
        });
      }

      // Find team member using the new static method - 404 error
      const teamMember = await User.findTeamMember(firstName, lastName, restaurant.organizationId);

      if (!teamMember) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'team_member_not_found',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(404).json({ 
          message: "Team member not found",
          error: "team_member_not_found"
        });
      }

      // Check user status - 403 errors
      if (teamMember.status === 'pending') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'pending_approval',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Your access request is still pending approval. Please contact the restaurant manager.",
          error: "pending_approval",
          status: "pending"
        });
      }

      if (teamMember.status === 'rejected') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'access_rejected',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Your access request has been rejected. Please contact the restaurant manager.",
          error: "access_rejected",
          status: "rejected"
        });
      }

      if (teamMember.status !== 'active') {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'account_inactive',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Account is not active",
          error: "account_inactive",
          status: teamMember.status
        });
      }

      // Check if user is active
      if (!teamMember.isActive) {
        logLoginAttempt({
          ip,
          restaurantName,
          firstName,
          lastName,
          success: false,
          error: 'account_deactivated',
          userAgent
        });
        
        updateLoginAttempts(ip, restaurantName, false);
        
        return res.status(403).json({ 
          message: "Account is not active",
          error: "account_deactivated"
        });
      }

      // Update last login
      teamMember.lastLogin = new Date();
      await teamMember.save();

      // Generate secure tokens for team member
      const { accessToken, refreshToken, tokenId, expiresIn } = generateTeamMemberTokens(teamMember._id);

      // Log successful login
      logLoginAttempt({
        ip,
        restaurantName,
        firstName,
        lastName,
        success: true,
        userAgent
      });

      // Reset login attempts for successful login
      resetLoginAttempts(ip);

      // Log security event for successful login
      logSecurityEvent({
        type: 'SUCCESSFUL_LOGIN',
        ip,
        restaurantName,
        firstName,
        lastName,
        severity: 'INFO',
        details: {
          tokenId,
          userId: teamMember._id,
          role: teamMember.role
        }
      });

      res.json({
        user: {
          id: teamMember._id,
          email: teamMember.email,
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          name: teamMember.name,
          role: teamMember.role,
          status: teamMember.status,
          permissions: teamMember.permissions,
          organization: teamMember.organization,
        },
        accessToken,
        refreshToken,
        expiresIn
      });
    } catch (error) {
      console.error("Login by name error:", error);
      
      // Log failed login attempt
      logLoginAttempt({
        ip,
        restaurantName: req.body?.restaurantName || 'unknown',
        firstName: req.body?.firstName || 'unknown',
        lastName: req.body?.lastName || 'unknown',
        success: false,
        error: 'server_error',
        userAgent
      });
      
      updateLoginAttempts(ip, req.body?.restaurantName || 'unknown', false);
      
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        error: "server_error"
      });
    }
  }
}

module.exports = teamMemberAuthController
