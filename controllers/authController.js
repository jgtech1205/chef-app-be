const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const User = require("../database/models/User")
const Restaurant = require("../database/models/Restaurant")
const { generateTokens } = require("../utils/tokenUtils")

const authController = {
  // Login user
  async login(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password } = req.body
      
      console.log('Login attempt:', { email, passwordLength: password?.length })

      // Find user by email
      const user = await User.findOne({ email })
      
      console.log('User found:', user ? { id: user._id, email: user.email, status: user.status, isActive: user.isActive } : 'No user found')
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" })
      }

      // Check user status (for team members)
      if (user.role === 'user' && user.status !== 'active') {
        if (user.status === 'pending') {
          return res.status(401).json({ 
            message: "Access pending approval",
            status: "pending"
          })
        } else if (user.status === 'rejected') {
          return res.status(401).json({ 
            message: "Access denied",
            status: "rejected"
          })
        } else {
          return res.status(401).json({ 
            message: "Account is not active",
            status: user.status
          })
        }
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id)

      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Name-based login for team members
  async loginWithName(req, res) {
    try {
      const { orgId } = req.params
      const { firstName, lastName } = req.body

      // Validate input
      if (!firstName || !lastName) {
        return res.status(400).json({ 
          message: "First name and last name are required" 
        })
      }

      // Find restaurant by organization ID
      const restaurant = await Restaurant.findOne({ organizationId: orgId, isActive: true })
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found or inactive" })
      }

      // Check if restaurant is active
      if (restaurant.status === 'suspended' || restaurant.status === 'cancelled') {
        return res.status(403).json({ message: "Restaurant access is currently suspended" })
      }

      // Find team member by name within this organization
      const teamMember = await User.findOne({ 
        organization: orgId,
        role: 'user',
        isActive: true,
        $or: [
          { name: `${firstName} ${lastName}` },
          { name: `${firstName} ${lastName}`.toLowerCase() },
          { name: `${firstName} ${lastName}`.toUpperCase() }
        ]
      })

      if (!teamMember) {
        return res.status(401).json({ 
          message: "Team member not found. Please check your name or contact your head chef." 
        })
      }

      // Check user status
      if (teamMember.status === 'pending') {
        return res.status(401).json({ 
          message: "Access pending approval. Please contact your head chef.",
          status: "pending"
        })
      }

      if (teamMember.status === 'rejected') {
        return res.status(401).json({ 
          message: "Access denied. Please contact your head chef.",
          status: "rejected"
        })
      }

      if (teamMember.status !== 'active') {
        return res.status(401).json({ 
          message: "Account is not active. Please contact your head chef.",
          status: teamMember.status
        })
      }

      // Update last login
      teamMember.lastLogin = new Date()
      await teamMember.save()

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(teamMember._id)

      res.json({
        message: "Login successful",
        user: {
          id: teamMember._id,
          email: teamMember.email,
          name: teamMember.name,
          role: teamMember.role,
          status: teamMember.status,
          permissions: teamMember.permissions,
          organization: teamMember.organization,
        },
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          organizationId: restaurant.organizationId,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Name-based login error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // QR Code - Return login URL instead of automatic login
  async qrAuth(req, res) {
    try {
      const { orgId } = req.params
      
      // Find restaurant by organization ID
      const restaurant = await Restaurant.findOne({ organizationId: orgId, isActive: true })
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found or inactive" })
      }

      // Check if restaurant is active
      if (restaurant.status === 'suspended' || restaurant.status === 'cancelled') {
        return res.status(403).json({ message: "Restaurant access is currently suspended" })
      }

      // Return the login URL for this restaurant
      const loginUrl = `${process.env.FRONTEND_URL || 'https://app.chefenplace.com'}/login/${orgId}`
      
      res.json({
        message: "QR code scanned successfully",
        loginUrl: loginUrl,
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          organizationId: restaurant.organizationId,
        }
      })
    } catch (error) {
      console.error("QR authentication error:", error)
      res.status(500).json({ message: "Server error during QR authentication" })
    }
  },

  async loginWithChefId(req, res) {
    try {
      const { chefId, headChefId } = req.params
      
      // First, find the head chef by organization ID
      const headChef = await User.findOne({ 
        organization: headChefId,
        role: 'head-chef',
        isActive: true 
      })
      
      if (!headChef) {
        return res.status(404).json({ message: "Head chef not found" })
      }
      
      // Find team member by chefId and verify they belong to this head chef
      const user = await User.findOne({ 
        _id: chefId, 
        headChef: headChef._id,
        organization: headChefId,
        isActive: true 
      })
      
      if (!user) {
        return res.status(404).json({ message: "User not found or not associated with this head chef" })
      }

      // Check user status and handle accordingly
      if (user.status === 'pending') {
        return res.status(401).json({ 
          message: "Access pending approval",
          status: "pending",
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
          }
        })
      }

      if (user.status === 'rejected') {
        return res.status(401).json({ 
          message: "Access denied",
          status: "rejected",
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status
          }
        })
      }

      if (user.status !== 'active') {
        return res.status(401).json({ 
          message: "User account is not active",
          status: user.status
        })
      }

      // Update last login
      user.lastLogin = new Date()
      await user.save()

      // Generate tokens for approved user
      const { accessToken, refreshToken } = generateTokens(user._id)
      
      res.json({
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          permissions: user.permissions,
          avatar: user.avatar,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Login with chefId error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Register user
  async register(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { email, password, name, role = "cook" } = req.body

      // Check if user exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Create user
      const user = new User({
        email,
        password,
        name,
        role,
      })

      await user.save()

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user._id)

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" })
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
      const user = await User.findById(decoded.userId)

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid refresh token" })
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id)

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
      })
    } catch (error) {
      console.error("Refresh token error:", error)
      res.status(401).json({ message: "Invalid refresh token" })
    }
  },

  // Logout
  async logout(req, res) {
    try {
      res.json({ message: "Logged out successfully" })
    } catch (error) {
      console.error("Logout error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body

      const user = await User.findOne({ email, isActive: true })
      if (!user) {
        return res.json({ message: "If email exists, reset link has been sent" })
      }

      // In production, send actual email with reset token
      res.json({ message: "If email exists, reset link has been sent" })
    } catch (error) {
      console.error("Forgot password error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body

      // In production, verify the reset token
      res.json({ message: "Password reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Accept chef invite via token
  async acceptChefInvite(req, res) {
    try {
      const { token } = req.params
      const { firstName, lastName } = req.body

      const decoded = jwt.verify(
        token,
        process.env.CHEF_INVITE_SECRET || "chef-invite-secret",
      )

      const headChefId = decoded.headChefId

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@chef.local`
      const tempPassword = Math.random().toString(36).slice(-8)

      const user = new User({
        email,
        password: tempPassword,
        name: `${firstName} ${lastName}`,
        role: "user",
        headChef: headChefId,
        status: "pending",
      })

      await user.save()

      res.status(201).json({ success: true, userId: user._id, status: user.status })
    } catch (error) {
      console.error("Accept chef invite error:", error)
      res.status(400).json({ message: "Invalid or expired invite" })
    }
  },
}

module.exports = authController
