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

      // Find user - check both regular users (isActive) and team members (status: 'active')
      const user = await User.findOne({ 
        email, 
        $or: [
          { isActive: true },
          { status: 'active' }
        ]
      })
      
      console.log('User found:', user ? { id: user._id, email: user.email, status: user.status, isActive: user.isActive } : 'No user found')
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" })
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

  // QR Code Authentication for Restaurant Access
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

      // Find existing approved users for this restaurant
      const existingUsers = await User.find({ 
        organization: orgId,
        status: 'active',
        role: 'user'
      }).select('name email qrAccess qrAccessDate');

      // If no existing users, create a new QR access user
      if (existingUsers.length === 0) {
        // Generate unique anonymous user for QR access
        const anonymousEmail = `qr-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@chef.local`
        const tempPassword = Math.random().toString(36).slice(-8)

        // Create anonymous user with QR access
        const qrUser = new User({
          email: anonymousEmail,
          password: tempPassword,
          name: `QR User ${Date.now()}`,
          role: "user",
          organization: orgId,
          restaurant: restaurant._id,
          status: "active",
          isActive: true,
          qrAccess: true, // New field to identify QR-based users
          qrAccessDate: new Date(),
          permissions: {
            // QR users get basic recipe viewing permissions
            canViewRecipes: true,
            canViewPlateups: true,
            canViewNotifications: true,
            canViewPanels: true,
            // No edit permissions for QR users
            canEditRecipes: false,
            canDeleteRecipes: false,
            canUpdateRecipes: false,
            canCreatePlateups: false,
            canDeletePlateups: false,
            canUpdatePlateups: false,
            canCreateNotifications: false,
            canDeleteNotifications: false,
            canUpdateNotifications: false,
            canCreatePanels: false,
            canDeletePanels: false,
            canUpdatePanels: false,
            canManageTeam: false,
            canAccessAdmin: false,
          },
        })

        await qrUser.save()

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(qrUser._id)

        res.json({
          message: "QR authentication successful",
          user: {
            id: qrUser._id,
            email: qrUser.email,
            name: qrUser.name,
            role: qrUser.role,
            organization: qrUser.organization,
            restaurant: qrUser.restaurant,
            permissions: qrUser.permissions,
            qrAccess: qrUser.qrAccess,
          },
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            organizationId: restaurant.organizationId,
          },
          accessToken,
          refreshToken,
        })
      } else {
        // Use the first existing approved user for QR access
        const existingUser = existingUsers[0];
        
        // Update QR access date
        existingUser.qrAccess = true;
        existingUser.qrAccessDate = new Date();
        await existingUser.save();

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(existingUser._id)

        res.json({
          message: "QR authentication successful",
          user: {
            id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
            organization: existingUser.organization,
            restaurant: existingUser.restaurant,
            permissions: existingUser.permissions,
            qrAccess: existingUser.qrAccess,
          },
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            organizationId: restaurant.organizationId,
          },
          accessToken,
          refreshToken,
        })
      }
    } catch (error) {
      console.error("QR authentication error:", error)
      res.status(500).json({ message: "Server error during QR authentication" })
    }
  },

  async loginWithChefId(req, res) {
    try {
      const { chefId, headChefId } = req.params
      // Find user by chefId
      const user = await User.findOne({ _id: chefId, status: "active", isActive: true, headChef: headChefId })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }
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
