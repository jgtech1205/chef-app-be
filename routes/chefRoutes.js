const express = require('express')
const { body } = require('express-validator')
const userController = require('../controllers/userController')

const router = express.Router()

/**
 * @swagger
 * /api/chefs/request-access:
 *   post:
 *     summary: Request access to join a head chef's team
 *     tags: [Chefs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - headChefId
 *               - firstName
 *               - lastName
 *             properties:
 *               headChefId:
 *                 type: string
 *                 description: Head chef's user ID
 *               firstName:
 *                 type: string
 *                 description: Team member's first name
 *               lastName:
 *                 type: string
 *                 description: Team member's last name
 *     responses:
 *       201:
 *         description: Access request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: Request ID (same as userId)
 *                 status:
 *                   type: string
 *                   enum: [pending]
 *                   description: Request status
 *                 userId:
 *                   type: string
 *                   description: Created user ID
 *       400:
 *         description: Validation error or duplicate request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Head chef not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// Request access to join a head chef's team
router.post(
  '/request-access',
  [
    body('headChefId').isMongoId(),
    body('firstName').trim().isLength({ min: 1 }),
    body('lastName').trim().isLength({ min: 1 }),
  ],
  userController.requestChefAccess,
)

/**
 * @swagger
 * /api/chefs/{chefId}:
 *   get:
 *     summary: Get team member status by ID
 *     tags: [Chefs]
 *     parameters:
 *       - in: path
 *         name: chefId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team member's user ID
 *     responses:
 *       200:
 *         description: Team member status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Team member's user ID
 *                     status:
 *                       type: string
 *                       enum: [pending, active, rejected]
 *                       description: Team member's status
 *                     name:
 *                       type: string
 *                       description: Team member's full name
 *       404:
 *         description: Team member not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/:id', userController.getProfileById)

module.exports = router
