// Main authentication controller - now acts as a router to specific controllers
const headChefAuthController = require('./headChefAuthController')
const teamMemberAuthController = require('./teamMemberAuthController')
const qrAuthController = require('./qrAuthController')
const passwordController = require('./passwordController')

const authController = {
  // Head Chef Authentication
  login: headChefAuthController.login,
  register: headChefAuthController.register,
  refreshToken: headChefAuthController.refreshToken,
  logout: headChefAuthController.logout,

  // Team Member Authentication
  loginTeamMember: teamMemberAuthController.loginTeamMember,
  loginByName: teamMemberAuthController.loginByName,
  loginWithName: teamMemberAuthController.loginByName, // Alias for backward compatibility

  // QR and Utility Authentication
  qrAuth: qrAuthController.qrAuth,
  loginWithChefId: qrAuthController.loginWithChefId,
  acceptChefInvite: qrAuthController.acceptChefInvite,

  // Password Management
  forgotPassword: passwordController.forgotPassword,
  resetPassword: passwordController.resetPassword
}

module.exports = authController
