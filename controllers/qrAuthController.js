const Restaurant = require("../database/models/Restaurant")
const User = require("../database/models/User")
const { generateTokens } = require("../utils/tokenUtils")

const qrAuthController = {
  // QR Code - Return login URL instead of automatic login
  async qrAuth(req, res) {
    try {
      const { orgId } = req.params

      // Validate organization ID - 400 error
      if (!orgId || typeof orgId !== 'string' || orgId.trim().length === 0) {
        return res.status(400).json({ 
          message: "Invalid restaurant identifier",
          error: "invalid_org_id"
        })
      }
      
      // Find restaurant by organization ID - 404 error
      const restaurant = await Restaurant.findOne({ organizationId: orgId, isActive: true })
      if (!restaurant) {
        return res.status(404).json({ 
          message: "Restaurant not found",
          error: "restaurant_not_found"
        })
      }

      // Check if restaurant is active - 403 error
      if (restaurant.status === 'suspended' || restaurant.status === 'cancelled') {
        return res.status(403).json({ 
          message: "Restaurant access is currently suspended",
          error: "restaurant_suspended"
        })
      }

      // Return the login URL for this restaurant using the slug
      const loginUrl = `${process.env.FRONTEND_URL || 'https://app.chefenplace.com'}/login/${restaurant.slug}`
      
      res.json({
        loginUrl: loginUrl,
        restaurantName: restaurant.name
      })
    } catch (error) {
      console.error("QR authentication error:", error)
      res.status(500).json({ 
        message: "Server error. Please try again later.",
        error: "server_error"
      })
    }
  },

  // Team member login with chef ID (legacy method)
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
          organization: user.organization,
        },
        accessToken,
        refreshToken,
      })
    } catch (error) {
      console.error("Login with chef ID error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Accept chef invite
  async acceptChefInvite(req, res) {
    try {
      const { token } = req.body

      if (!token) {
        return res.status(400).json({ message: "Invitation token is required" })
      }

      // Verify invitation token and update user status
      // This is a placeholder - implement based on your invitation system
      res.json({ message: "Invitation accepted successfully" })
    } catch (error) {
      console.error("Accept chef invite error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
}

module.exports = qrAuthController
