const express = require("express")
const { body } = require("express-validator")
const adminController = require("../controllers/adminController")
const auth = require("../middlewares/auth")
const checkPermission = require("../middlewares/checkPermission")

const router = express.Router()

// All routes require authentication and admin access
router.use(auth)
router.use(checkPermission("canAccessAdmin"))

// Dashboard stats
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get("/dashboard", adminController.getDashboardStats)

// User management
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/users", adminController.getAllUsers)
/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 */
router.get("/users/:id", adminController.getUser)
/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  "/users/:id",
  [body("role").optional().isIn(["head-chef", "user"]), body("isActive").optional().isBoolean()],
  adminController.updateUser,
)
/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete("/users/:id", adminController.deleteUser)

// System settings
/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings data
 */
router.get("/settings", adminController.getSystemSettings)
/**
 * @swagger
 * /api/admin/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put("/settings", adminController.updateSystemSettings)

// Activity logs
/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get activity logs
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Log list
 */
router.get("/logs", adminController.getActivityLogs)

// Backup and restore
/**
 * @swagger
 * /api/admin/backup:
 *   post:
 *     summary: Create backup
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Backup created
 */
router.post("/backup", adminController.createBackup)
/**
 * @swagger
 * /api/admin/restore:
 *   post:
 *     summary: Restore backup
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Backup restored
 */
router.post("/restore", adminController.restoreBackup)

module.exports = router
