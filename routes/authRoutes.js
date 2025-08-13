const express = require("express")
const { body } = require("express-validator")
const authController = require("../controllers/authController")
const auth = require("../middlewares/auth")
const { loginByNameLimiter, trackLoginAttempts, resetLoginAttempts } = require("../middlewares/rateLimiter")
const { loginByNameValidation, sanitizeLoginByNameInputs } = require("../utils/inputValidation")

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
 *     summary: Login user with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                     avatar:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or access denied
 *       500:
 *         description: Server error
 */
router.post("/login", [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required")
], authController.login)

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
 *     summary: QR code authentication - returns restaurant login URL
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID (restaurant identifier)
 *     responses:
 *       200:
 *         description: QR code scanned successfully, returns restaurant login URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loginUrl:
 *                   type: string
 *                   description: Restaurant-specific login URL using slug
 *                   example: "https://app.chefenplace.com/login/joes-pizza"
 *                 restaurantName:
 *                   type: string
 *                   description: Restaurant name
 *                   example: "Joe's Pizza"
 *       400:
 *         description: Invalid restaurant identifier
 *       403:
 *         description: Restaurant access suspended
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.post("/qr/:orgId", authController.qrAuth)

/**
 * @swagger
 * /api/auth/login/name/{orgId}:
 *   post:
 *     summary: Team member login with first and last name
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID (restaurant identifier)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: Team member's first name
 *               lastName:
 *                 type: string
 *                 description: Team member's last name
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
 *                     organization:
 *                       type: string
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
 *       400:
 *         description: Missing first name or last name
 *       401:
 *         description: Team member not found or access denied
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
 *         description: Restaurant not found
 *       403:
 *         description: Restaurant access suspended
 */
router.post("/login/name/:orgId", authController.loginWithName)

/**
 * @swagger
 * /api/auth/login-by-name:
 *   post:
 *     summary: Team member login with restaurant name and first/last name (SECURE)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - firstName
 *               - lastName
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 description: Restaurant name (will be converted to kebab-case)
 *                 minLength: 1
 *                 maxLength: 100
 *               firstName:
 *                 type: string
 *                 description: Team member's first name
 *                 minLength: 1
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 description: Team member's last name
 *                 minLength: 1
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Login successful for approved team member
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                     organization:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *                   description: Token expiration time in seconds
 *       400:
 *         description: Missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       403:
 *         description: Access denied, pending approval, or restaurant suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Restaurant or team member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post("/login-by-name", 
  // Rate limiting middleware
  loginByNameLimiter,
  trackLoginAttempts,
  
  // Input validation middleware
  loginByNameValidation,
  sanitizeLoginByNameInputs,
  
  // Controller
  authController.loginByName
)

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

/**
 * @swagger
 * /api/auth/login-team-member:
 *   post:
 *     summary: Team member login with first name as username and last name as password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - username
 *               - password
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 description: Restaurant name (will be converted to slug)
 *                 example: "Joe's Pizza"
 *               username:
 *                 type: string
 *                 description: Team member's first name
 *                 example: "John"
 *               password:
 *                 type: string
 *                 description: Team member's last name
 *                 example: "Doe"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     permissions:
 *                       type: object
 *                     organization:
 *                       type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 expiresIn:
 *                   type: number
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending, rejected, or inactive
 *       404:
 *         description: Restaurant or team member not found
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Server error
 */
router.post("/login-team-member", 
  // Rate limiting middleware
  loginByNameLimiter,
  trackLoginAttempts,
  
  // Input validation middleware
  [
    body('restaurantName')
      .notEmpty()
      .withMessage('Restaurant name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Restaurant name must be between 1 and 100 characters'),
    body('username')
      .notEmpty()
      .withMessage('First name (username) is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('password')
      .notEmpty()
      .withMessage('Last name (password) is required')
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters')
  ],
  sanitizeLoginByNameInputs,
  
  // Controller
  authController.loginTeamMember
)

// Chef invite via token
router.post(
  "/chef-invite/:token",
  [body("firstName").trim().isLength({ min: 1 }), body("lastName").trim().isLength({ min: 1 })],
  authController.acceptChefInvite,
)

module.exports = router
