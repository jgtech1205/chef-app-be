const express = require("express")
const { body } = require("express-validator")
const authController = require("../controllers/authController")
const auth = require("../middlewares/auth")

const router = express.Router()

// Validation rules
const loginValidation = [body("email").isEmail().normalizeEmail(), body("password").isLength({ min: 6 })]

const registerValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("name").trim().isLength({ min: 2 }),
  body("role").optional().isIn(["head-chef", "user"]),
]

// Routes
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 */
router.post("/login", loginValidation, authController.login)

/**
 * @swagger
 * /api/auth/login/{headChefId}/{chefId}:
 *   post:
 *     summary: Team member login with head chef and chef IDs
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: headChefId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID (same as head chef's organization field)
 *       - in: path
 *         name: chefId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member user ID
 *     responses:
 *       200:
 *         description: Login successful for approved team member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                     avatar:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Access denied or pending approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *       404:
 *         description: User not found
 */
router.post("/login/:headChefId/:chefId", authController.loginWithChefId)

/**
 * @swagger
 * /api/auth/qr/{orgId}:
 *   post:
 *     summary: Authenticate via QR code for restaurant access
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant organization ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: {}
 *     responses:
 *       200:
 *         description: QR authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                     qrAccess:
 *                       type: boolean
 *                 restaurant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     organizationId:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Access denied or pending approval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Restaurant or head chef not found
 *       403:
 *         description: Restaurant access suspended
 */
router.post("/qr/:orgId", authController.qrAuth)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register user
 *     tags: [Auth]
 *     responses:
 *       201:
 *         description: User created
 */
router.post("/register", registerValidation, authController.register)
/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token
 */
router.post("/refresh-token", authController.refreshToken)
/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post("/logout", auth, authController.logout)
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Reset email sent
 */
router.post("/forgot-password", [body("email").isEmail()], authController.forgotPassword)
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
  "/reset-password",
  [body("token").notEmpty(), body("password").isLength({ min: 6 })],
  authController.resetPassword,
)

// Chef invite via token
router.post(
  "/chef-invite/:token",
  [body("firstName").trim().isLength({ min: 1 }), body("lastName").trim().isLength({ min: 1 })],
  authController.acceptChefInvite,
)

module.exports = router
