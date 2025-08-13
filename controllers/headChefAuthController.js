const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const User = require("../database/models/User")
const { generateHeadChefTokens } = require("../utils/tokenUtils")

const headChefAuthController = {
  // Head chef login with email and password
  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: "Please provide a valid email and password",
          error: "validation_error",
          errors: errors.array() 
        })
      }

      const { email, password } = req.body
      
      // Validate input - 400 errors
      if (!email || typeof email !== 'string' || email.trim().length === 0) {
        return res.status(400).json({ 
          message: "Please provide a valid email and password",
          error: "invalid_email"
        })
      }

      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return res.status(400).json({ 
          message: "Please provide a valid email and password",
          error: "invalid_password"
        })
      }

      console.log('Head chef login attempt:', { email, passwordLength: password?.length })

      // Find user by email - 401 error
      const user = await User.findOne({ email: email.trim().toLowerCase() })
      
      console.log('User found:', user ? { id: user._id, email: user.email, status: user.status, isActive: user.isActive } : 'No user found')
      
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid email or password",
          error: "invalid_credentials"
        })
      }

      // Check if user is active - 403 error
      if (!user.isActive) {
        return res.status(403).json({ 
          message: "Account is not active",
          error: "account_deactivated"
        })
      }

      // Check if user is a head chef
      if (user.role !== 'head-chef') {
        return res.status(403).json({ 
          message: "Access denied. Head chef privileges required.",
          error: "insufficient_permissions"
        })
      }

      // Check password - 401 error
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({ 
          message: "Invalid email or password",
          error: "invalid_credentials"
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate tokens for head chef
      const { accessToken, refreshToken, tokenId, expiresIn } = generateHeadChefTokens(user._id)

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
        expiresIn
      })
    } catch (error) {
      console.error("Head chef login error:", error)
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        error: "server_error"
      })
    }
  },

  // Head chef registration
  async register(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, name, firstName, lastName } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Create new head chef user
      const user = new User({
        email: email.toLowerCase(),
        password,
        firstName: firstName || name?.split(' ')[0] || '',
        lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
        name: name || `${firstName || ''} ${lastName || ''}`.trim(),
        role: 'head-chef',
        status: 'active',
        isActive: true,
        permissions: {
          // Head chef gets all permissions
          canViewRecipes: true,
          canEditRecipes: true,
          canDeleteRecipes: true,
          canUpdateRecipes: true,
          canCreatePlateups: true,
          canDeletePlateups: true,
          canUpdatePlateups: true,
          canCreateNotifications: true,
          canDeleteNotifications: true,
          canUpdateNotifications: true,
          canCreatePanels: true,
          canDeletePanels: true,
          canUpdatePanels: true,
          canManageTeam: true,
          canAccessAdmin: true,
          canViewPlateups: true,
          canViewNotifications: true,
          canViewPanels: true,
        },
      })

      await user.save()

      // Generate tokens
      const { accessToken, refreshToken, tokenId, expiresIn } = generateHeadChefTokens(user._id)

      res.status(201).json({
        message: "Head chef registered successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
        accessToken,
        refreshToken,
        expiresIn
      })
    } catch (error) {
      console.error("Head chef registration error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Refresh token for head chef
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" })
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key")
      
      // Check if user exists and is a head chef
      const user = await User.findById(decoded.userId)
      if (!user || user.role !== 'head-chef' || !user.isActive) {
        return res.status(401).json({ message: "Invalid refresh token" })
      }

      // Generate new tokens
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, tokenId, expiresIn } = generateHeadChefTokens(user._id)

      res.json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn
      })
    } catch (error) {
      console.error("Token refresh error:", error)
      res.status(401).json({ message: "Invalid refresh token" })
    }
  },

  // Logout head chef
  async logout(req, res) {
    try {
      // In a production environment, you might want to blacklist the token
      res.json({ message: "Logged out successfully" })
    } catch (error) {
      console.error("Logout error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
}

module.exports = headChefAuthController
