const express = require('express');
const { body } = require('express-validator');
const restaurantController = require('../controllers/restaurantController');
const auth = require('../middlewares/auth');
const adminAuth = require('../middlewares/adminAuth');
const headChefAuth = require('../middlewares/headChefAuth');

const router = express.Router();

// Restaurant signup validation
const restaurantSignupValidation = [
  body('restaurantName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Restaurant name must be between 2 and 100 characters'),
  body('restaurantType')
    .optional()
    .isIn(['fast-casual', 'fine-dining', 'cafe', 'bakery', 'food-truck', 'catering', 'other'])
    .withMessage('Invalid restaurant type'),
  body('headChefName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Head chef name must be between 2 and 50 characters'),
  body('headChefEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('headChefPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('planType')
    .optional()
    .isIn(['trial', 'pro', 'enterprise'])
    .withMessage('Invalid plan type'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Billing cycle must be monthly or yearly'),
];

// Location validation
const locationValidation = [
  body('location.address').optional().trim().isLength({ max: 200 }),
  body('location.city').optional().trim().isLength({ max: 100 }),
  body('location.state').optional().trim().isLength({ max: 50 }),
  body('location.zipCode').optional().trim().isLength({ max: 20 }),
  body('location.country').optional().trim().isLength({ max: 50 }),
];

// Public Routes (no auth required)

/**
 * @swagger
 * /api/restaurant/signup:
 *   post:
 *     summary: Create new restaurant account
 *     tags: [Restaurant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - headChefName
 *               - headChefEmail
 *               - headChefPassword
 *             properties:
 *               restaurantName:
 *                 type: string
 *               restaurantType:
 *                 type: string
 *                 enum: [fast-casual, fine-dining, cafe, bakery, food-truck, catering, other]
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               headChefName:
 *                 type: string
 *               headChefEmail:
 *                 type: string
 *               headChefPassword:
 *                 type: string
 *               planType:
 *                 type: string
 *                 enum: [trial, pro, enterprise]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *       400:
 *         description: Validation error or restaurant already exists
 */
router.post('/signup', 
  [...restaurantSignupValidation, ...locationValidation], 
  restaurantController.createRestaurant
);

/**
 * @swagger
 * /api/restaurant/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Restaurant]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email/:token', restaurantController.verifyEmail);

// Protected Routes (require authentication)

/**
 * @swagger
 * /api/restaurant/super-admin/restaurants:
 *   get:
 *     summary: Get all restaurants (Super Admin only)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [trial, active, suspended, cancelled]
 *     responses:
 *       200:
 *         description: List of restaurants
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 */
router.get('/super-admin/restaurants', adminAuth, restaurantController.getAllRestaurants);

/**
 * @swagger
 * /api/restaurant/super-admin/stats:
 *   get:
 *     summary: Get restaurant statistics (Super Admin only)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 */
router.get('/super-admin/stats', adminAuth, restaurantController.getRestaurantStats);

// Head Chef Routes (restaurant management)

/**
 * @swagger
 * /api/restaurant/head-chef/my-restaurant:
 *   get:
 *     summary: Get head chef's restaurant details
 *     tags: [Head Chef]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Head Chef access required
 */
router.get('/head-chef/my-restaurant', headChefAuth, restaurantController.getMyRestaurant);

/**
 * @swagger
 * /api/restaurant/head-chef/update:
 *   put:
 *     summary: Update head chef's restaurant
 *     tags: [Head Chef]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Head Chef access required
 */
router.put('/head-chef/update', headChefAuth, restaurantController.updateMyRestaurant);

module.exports = router;