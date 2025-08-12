const express = require("express")
const { body } = require("express-validator")
const userController = require("../controllers/userController")
const auth = require("../middlewares/auth")
const checkPermission = require("../middlewares/checkPermission")
const upload = require("../middlewares/upload")

const router = express.Router()

// All routes require authentication
router.use(auth)

// Profile routes
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/profile", userController.getProfile)
/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  [body("name").optional().trim().isLength({ min: 2 }), body("email").optional().isEmail().normalizeEmail()],
  userController.updateProfile,
)
/**
 * @swagger
 * /api/users/profile/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.post("/profile/avatar", upload.single("avatar"), userController.uploadAvatar)
/**
 * @swagger
 * /api/users/profile/avatar:
 *   delete:
 *     summary: Delete user avatar
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Avatar deleted
 */
router.delete("/profile/avatar", userController.deleteAvatar)

// Password change
/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Password changed
 */
router.put(
  "/change-password",
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 6 })],
  userController.changePassword,
)

// Preferences
/**
 * @swagger
 * /api/users/preferences:
 *   put:
 *     summary: Update user preferences
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Preferences updated
 */
router.put("/preferences", userController.updatePreferences)

// Team management (requires permission)
/**
 * @swagger
 * /api/users/team:
 *   get:
 *     summary: Get team members
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Team list
 */
router.get("/team", checkPermission("canManageTeam"), userController.getTeamMembers)
/**
 * @swagger
 * /api/users/team/invite:
 *   post:
 *     summary: Invite team member
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Invitation sent
 */
router.post(
  "/team/invite",
  checkPermission("canManageTeam"),
  [body("email").isEmail().normalizeEmail(), body("role").isIn(["head-chef", "user"])],
  userController.inviteTeamMember,
)
/**
 * @swagger
 * /api/users/team/{id}:
 *   put:
 *     summary: Update team member
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member updated
 */
router.put(
  "/team/:id",
  checkPermission("canManageTeam"),
  [body("role").optional().isIn(["head-chef", "user"])],
  userController.updateTeamMember,
)
/**
 * @swagger
 * /api/users/team/{id}:
 *   delete:
 *     summary: Remove team member
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member removed
 */
router.delete("/team/:id", checkPermission("canManageTeam"), userController.removeTeamMember)

// Generate invite link for chefs
router.get("/invite-link", checkPermission("canManageTeam"), userController.generateInviteLink)

// Pending chef management
router.get("/pending-chefs", checkPermission("canManageTeam"), userController.listPendingChefs)
router.put("/pending-chefs/:id", checkPermission("canManageTeam"), userController.updatePendingChef)

// Team member folder
/**
 * @swagger
 * /api/users/team-folder:
 *   get:
 *     summary: Get team member folder with login information
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Team member folder retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalOrganizations:
 *                           type: number
 *                         totalTeamMembers:
 *                           type: number
 *                         activeTeamMembers:
 *                           type: number
 *                         pendingTeamMembers:
 *                           type: number
 *                         rejectedTeamMembers:
 *                           type: number
 *                     organizations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           status:
 *                             type: string
 *                           loginLink:
 *                             type: string
 *                           qrCodeUrl:
 *                             type: string
 *                           teamMemberLoginEndpoint:
 *                             type: string
 *                           teamMembers:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 email:
 *                                   type: string
 *                                 status:
 *                                   type: string
 *                                 permissions:
 *                                   type: object
 *                                 lastLogin:
 *                                   type: string
 *                                 loginUrl:
 *                                   type: string
 *                                 loginInstructions:
 *                                   type: object
 */
router.get("/team-folder", checkPermission("canManageTeam"), userController.getTeamMemberFolder)

/**
 * @swagger
 * /api/users/team-folder/{memberId}:
 *   get:
 *     summary: Get specific team member details with login info
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member's user ID
 *     responses:
 *       200:
 *         description: Team member details retrieved successfully
 *       404:
 *         description: Team member not found
 */
router.get("/team-folder/:memberId", checkPermission("canManageTeam"), userController.getTeamMemberDetails)

// Team member reactivation links (for after 1-year token expires)
/**
 * @swagger
 * /api/users/reactivation-links:
 *   get:
 *     summary: Get all team member reactivation links
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Team member reactivation links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalTeamMembers:
 *                       type: number
 *                     activeTeamMembers:
 *                       type: number
 *                     reactivationLinks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           teamMemberId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                           organizationId:
 *                             type: string
 *                           organizationName:
 *                             type: string
 *                           lastLogin:
 *                             type: string
 *                           reactivationLink:
 *                             type: string
 *                             description: Full URL for reactivation
 *                           reactivationInstructions:
 *                             type: object
 *                     organizationGroups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           organizationId:
 *                             type: string
 *                           organizationName:
 *                             type: string
 *                           teamMembers:
 *                             type: array
 *                     instructions:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                         description:
 *                           type: string
 *                         usage:
 *                           type: string
 *                         note:
 *                           type: string
 */
router.get("/reactivation-links", checkPermission("canManageTeam"), userController.getTeamMemberReactivationLinks)

/**
 * @swagger
 * /api/users/reactivation-links/{memberId}:
 *   get:
 *     summary: Get specific team member reactivation link
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member's user ID
 *     responses:
 *       200:
 *         description: Team member reactivation link retrieved successfully
 *       404:
 *         description: Team member not found or inactive
 */
router.get("/reactivation-links/:memberId", checkPermission("canManageTeam"), userController.getTeamMemberReactivationLink)

// Organization login links
/**
 * @swagger
 * /api/users/organizations/login-links:
 *   get:
 *     summary: Get all organizations with team member login links
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Organizations with login links retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Organization ID
 *                       name:
 *                         type: string
 *                         description: Organization name
 *                       status:
 *                         type: string
 *                         description: Organization status
 *                       loginLink:
 *                         type: string
 *                         description: QR code URL for team member login
 *                       qrCodeUrl:
 *                         type: string
 *                         description: Same as loginLink
 *                       teamMemberLoginEndpoint:
 *                         type: string
 *                         description: API endpoint for team member login
 */
router.get("/organizations/login-links", checkPermission("canManageTeam"), userController.getOrganizationsWithLoginLinks)

/**
 * @swagger
 * /api/users/organizations/{organizationId}/login-link:
 *   get:
 *     summary: Get team member login link for specific organization
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Organization login link retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     organizationId:
 *                       type: string
 *                     organizationName:
 *                       type: string
 *                     loginLink:
 *                       type: string
 *                       description: QR code URL
 *                     qrCodeUrl:
 *                       type: string
 *                       description: Same as loginLink
 *                     teamMembers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                           loginUrl:
 *                             type: string
 *                     instructions:
 *                       type: object
 *                       properties:
 *                         qrCode:
 *                           type: string
 *                         manualLogin:
 *                           type: string
 *                         chefIds:
 *                           type: array
 *                           items:
 *                             type: string
 */
router.get("/organizations/:organizationId/login-link", checkPermission("canManageTeam"), userController.generateTeamMemberLoginLink)

// Utility endpoints
router.get("/status/:id", userController.getUserStatus)
router.get("/profile/id/:id", userController.getProfileById)
router.get("/saved-recipes", userController.getSavedRecipes)

module.exports = router
