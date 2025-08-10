const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Restaurant = require('../database/models/Restaurant');
const User = require('../database/models/User');
const Subscription = require('../database/models/Subscription');

// Stripe configuration
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
}

// Email service (we'll implement this)
const emailService = require('../services/emailService');

const restaurantController = {
  // Step 1: Restaurant information collection
  async createRestaurant(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        restaurantName,
        restaurantType,
        location,
        headChefName,
        headChefEmail,
        headChefPassword,
        planType = 'trial',
        billingCycle = 'monthly',
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ email: headChefEmail });
      if (existingUser) {
        return res.status(400).json({ 
          message: 'An account with this email already exists' 
        });
      }

      // Generate organization ID from restaurant name
      const organizationId = restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if organization ID already exists
      const existingRestaurant = await Restaurant.findOne({ organizationId });
      if (existingRestaurant) {
        return res.status(400).json({
          message: 'A restaurant with this name already exists. Please choose a different name.'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(headChefPassword, 12);

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create head chef user
      const headChef = new User({
        email: headChefEmail,
        password: hashedPassword,
        name: headChefName,
        role: 'head-chef',
        organization: organizationId,
        emailVerificationToken,
        emailVerificationExpires,
        status: 'active',
        permissions: {
          // Head chef gets all permissions
          canViewRecipes: true,
          canEditRecipes: true,
          canDeleteRecipes: true,
          canUpdateRecipes: true,
          canCreatePlateups: true,
          canDeletePlateups: true,
          canUpdatePlateups: true,
          canCreateNotifications: true,
          canDeleteNotifications: true,
          canUpdateNotifications: true,
          canCreatePanels: true,
          canDeletePanels: true,
          canUpdatePanels: true,
          canManageTeam: true,
          canAccessAdmin: true,
          canViewPlateups: true,
          canViewNotifications: true,
          canViewPanels: true,
        },
      });

      await headChef.save();

      // Create restaurant
      const restaurant = new Restaurant({
        name: restaurantName,
        type: restaurantType,
        location,
        organizationId,
        headChef: headChef._id,
        status: planType === 'trial' ? 'trial' : 'active',
      });

      await restaurant.save();

      // Link user to restaurant
      headChef.restaurant = restaurant._id;
      await headChef.save();

      // If not trial, create Stripe customer and subscription
      let subscription = null;
      if (planType !== 'trial') {
        subscription = await this.createStripeSubscription(restaurant, planType, billingCycle);
      }

      // Send email verification
      try {
        await emailService.sendVerificationEmail(headChef.email, headChef.name, emailVerificationToken);
      } catch (emailError) {
        console.error('Email service error:', emailError);
        // Don't fail the entire registration if email fails
      }

      // Generate JWT token for immediate login
      const accessToken = jwt.sign(
        { userId: headChef._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const refreshToken = jwt.sign(
        { userId: headChef._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        success: true,
        message: 'Restaurant created successfully',
        data: {
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
            organizationId: restaurant.organizationId,
            status: restaurant.status,
            planType: restaurant.settings.planType,
            trialEndDate: restaurant.trialEndDate,
          },
          user: {
            id: headChef._id,
            email: headChef.email,
            name: headChef.name,
            role: headChef.role,
            organization: headChef.organization,
            emailVerified: headChef.emailVerified,
            permissions: headChef.permissions,
          },
          subscription: subscription ? {
            planType: subscription.planType,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          } : null,
          accessToken,
          refreshToken,
        },
      });

    } catch (error) {
      console.error('Restaurant creation error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: 'Server error during restaurant creation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },

  // Create Stripe subscription
  async createStripeSubscription(restaurant, planType, billingCycle) {
    try {
      if (!stripe) {
        console.warn('Stripe not configured - skipping subscription creation');
        return null;
      }
      
      // Plan pricing configuration
      const planPricing = {
        pro: {
          monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
        },
        enterprise: {
          monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
          yearly: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
        },
      };

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: restaurant.headChef.email,
        name: restaurant.name,
        metadata: {
          restaurantId: restaurant._id.toString(),
          organizationId: restaurant.organizationId,
        },
      });

      // Create subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: planPricing[planType][billingCycle],
        }],
        trial_period_days: 14, // 14-day trial
        metadata: {
          restaurantId: restaurant._id.toString(),
          planType,
          billingCycle,
        },
      });

      // Save subscription to database
      const subscription = new Subscription({
        restaurant: restaurant._id,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: planPricing[planType][billingCycle],
        planType,
        billingCycle,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : null,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        pricing: {
          amount: stripeSubscription.items.data[0].price.unit_amount,
          currency: stripeSubscription.items.data[0].price.currency,
        },
      });

      await subscription.save();

      // Update restaurant with subscription
      restaurant.subscription = subscription._id;
      restaurant.updatePlan(planType);
      await restaurant.save();

      return subscription;

    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw error;
    }
  },

  // Get all restaurants (Admin only)
  async getAllRestaurants(req, res) {
    try {
      const { page = 1, limit = 10, search, status } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { organizationId: { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      const restaurants = await Restaurant.find(query)
        .populate('headChef', 'name email')
        .populate('subscription')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Restaurant.countDocuments(query);

      res.json({
        success: true,
        data: restaurants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });

    } catch (error) {
      console.error('Get restaurants error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get restaurant stats for admin dashboard
  async getRestaurantStats(req, res) {
    try {
      const totalRestaurants = await Restaurant.countDocuments();
      const activeRestaurants = await Restaurant.countDocuments({ status: 'active' });
      const trialRestaurants = await Restaurant.countDocuments({ status: 'trial' });
      const cancelledRestaurants = await Restaurant.countDocuments({ status: 'cancelled' });

      const planDistribution = await Restaurant.aggregate([
        { $group: { _id: '$settings.planType', count: { $sum: 1 } } }
      ]);

      res.json({
        success: true,
        data: {
          total: totalRestaurants,
          active: activeRestaurants,
          trial: trialRestaurants,
          cancelled: cancelledRestaurants,
          planDistribution,
        },
      });

    } catch (error) {
      console.error('Restaurant stats error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Email verification
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email verified successfully',
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Head Chef specific methods
  async getMyRestaurant(req, res) {
    try {
      const restaurant = await Restaurant.findById(req.restaurant._id)
        .populate('headChef', 'name email')
        .populate('subscription');

      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      res.json({
        success: true,
        data: restaurant,
      });

    } catch (error) {
      console.error('Get my restaurant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async updateMyRestaurant(req, res) {
    try {
      const { name, type, location } = req.body;
      
      const restaurant = await Restaurant.findById(req.restaurant._id);
      
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }

      // Update allowed fields
      if (name) restaurant.name = name;
      if (type) restaurant.type = type;
      if (location) restaurant.location = { ...restaurant.location, ...location };

      await restaurant.save();

      res.json({
        success: true,
        message: 'Restaurant updated successfully',
        data: restaurant,
      });

    } catch (error) {
      console.error('Update my restaurant error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};

module.exports = restaurantController;