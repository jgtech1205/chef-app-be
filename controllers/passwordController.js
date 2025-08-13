const { validationResult } = require("express-validator")
const User = require("../database/models/User")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

const passwordController = {
  // Forgot password
  async forgotPassword(req, res) {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({ message: "Email is required" })
      }

      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

      user.resetPasswordToken = resetToken
      user.resetPasswordExpires = resetTokenExpiry
      await user.save()

      // Send email with reset link (implement your email service)
      // await sendPasswordResetEmail(user.email, resetToken)

      res.json({ message: "Password reset email sent" })
    } catch (error) {
      console.error("Forgot password error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },

  // Reset password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" })
      }

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      })

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      user.password = hashedPassword
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()

      res.json({ message: "Password reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
}

module.exports = passwordController
