const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcrypt = require('bcryptjs');
const Restaurant = require('../database/models/Restaurant');
const User = require('../database/models/User');
const Subscription = require('../database/models/Subscription');

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { planType, billingCycle, restaurantName, headChefEmail, headChefName, headChefPassword, restaurantType, location } = req.body;

    // Define product prices based on plan type
    const prices = {
      pro: {
        monthly: 'price_1RtHxvLZbDft1KIrxVczaYMt', // Pro Monthly $49
        yearly: 'price_1RtHxvLZbDft1KIrxVczaYMt' // Using same price for now
      },
      enterprise: {
        monthly: 'price_1RtHxvLZbDft1KIrxVczaYMt', // Using same price for now
        yearly: 'price_1RtHxvLZbDft1KIrxVczaYMt' // Using same price for now
      }
    };

    const priceId = prices[planType]?.[billingCycle];
    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan or billing cycle' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?success=true&sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/restaurant-signup?canceled=true`,
      metadata: {
        restaurantName,
        headChefEmail,
        headChefName,
        headChefPassword,
        restaurantType,
        planType,
        billingCycle,
        address: location?.address || '',
        city: location?.city || '',
        state: location?.state || '',
        zipCode: location?.zipCode || '',
        country: location?.country || 'US',
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing completed checkout session:', session.id);
    console.log('Session metadata:', session.metadata);
    
    const {
      restaurantName,
      headChefEmail,
      headChefName,
      headChefPassword,
      restaurantType,
      planType,
      billingCycle,
      address,
      city,
      state,
      zipCode,
      country,
    } = session.metadata;

    console.log('Extracted data:', {
      restaurantName,
      headChefEmail,
      headChefName,
      restaurantType,
      planType,
      billingCycle
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: headChefEmail });
    if (existingUser) {
      console.log('User already exists:', headChefEmail);
      return;
    }

    // Generate organization ID
    const organizationId = restaurantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ organizationId });
    if (existingRestaurant) {
      console.log('Restaurant already exists:', organizationId);
      return;
    }

    // Create head chef user
    const headChef = new User({
      email: headChefEmail,
      password: headChefPassword,
      name: headChefName,
      role: 'head-chef',
      organization: organizationId,
      status: 'active',
      permissions: {
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
    console.log('Head chef user created:', {
      id: headChef._id,
      email: headChef.email,
      name: headChef.name,
      role: headChef.role,
      status: headChef.status,
      isActive: headChef.isActive
    });

    // Create restaurant
    const restaurant = new Restaurant({
      name: restaurantName,
      type: restaurantType,
      location: {
        address,
        city,
        state,
        zipCode,
        country,
      },
      organizationId,
      headChef: headChef._id,
      status: 'active',
    });

    await restaurant.save();
    console.log('Restaurant created:', {
      id: restaurant._id,
      name: restaurant.name,
      organizationId: restaurant.organizationId
    });

    // Link user to restaurant
    headChef.restaurant = restaurant._id;
    await headChef.save();

    // Create Stripe subscription
    if (planType !== 'trial') {
      await createStripeSubscription(restaurant, session, planType, billingCycle);
    }

    console.log('Successfully created restaurant and user:', restaurantName);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

// Create Stripe subscription
async function createStripeSubscription(restaurant, session, planType, billingCycle) {
  try {
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

    // Get customer from session
    const customer = await stripe.customers.retrieve(session.customer);

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: planPricing[planType][billingCycle],
      }],
      trial_period_days: 14,
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

    console.log('Successfully created subscription for restaurant:', restaurant.name);
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({ 
      stripeSubscriptionId: subscription.id 
    });
    
    if (dbSubscription) {
      dbSubscription.status = subscription.status;
      dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      await dbSubscription.save();
      
      console.log('Updated subscription status:', subscription.status);
    }
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    const dbSubscription = await Subscription.findOne({ 
      stripeSubscriptionId: subscription.id 
    });
    
    if (dbSubscription) {
      dbSubscription.status = 'canceled';
      await dbSubscription.save();
      
      // Update restaurant status
      const restaurant = await Restaurant.findById(dbSubscription.restaurant);
      if (restaurant) {
        restaurant.status = 'suspended';
        await restaurant.save();
      }
      
      console.log('Subscription canceled for restaurant:', restaurant?.name);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Verify session and get user data
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Find the user that was created
      let user = await User.findOne({ email: session.metadata.headChefEmail });
      
      // If user doesn't exist, create them (for development)
      if (!user) {
        console.log('User not found, creating user from session metadata...');
        
        const {
          restaurantName,
          headChefEmail,
          headChefName,
          headChefPassword,
          restaurantType,
          planType,
          billingCycle,
          address,
          city,
          state,
          zipCode,
          country,
        } = session.metadata;

        // Generate organization ID
        const organizationId = restaurantName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        // Create head chef user
        user = new User({
          email: headChefEmail,
          password: headChefPassword,
          name: headChefName,
          role: 'head-chef',
          organization: organizationId,
          status: 'active',
          permissions: {
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

        await user.save();
        console.log('User created successfully:', user.email);
        
        // Create restaurant
        const restaurant = new Restaurant({
          name: restaurantName,
          type: restaurantType,
          location: {
            address,
            city,
            state,
            zipCode,
            country,
          },
          organizationId,
          headChef: user._id,
          status: 'active',
        });

        await restaurant.save();
        console.log('Restaurant created successfully:', restaurant.name);

        // Link user to restaurant
        user.restaurant = restaurant._id;
        await user.save();
      }
      
      if (user) {
        // Generate tokens
        const jwt = require('jsonwebtoken');
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );
        const refreshToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_REFRESH_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          success: true,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
          },
          accessToken,
          refreshToken,
        });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
});



module.exports = router;