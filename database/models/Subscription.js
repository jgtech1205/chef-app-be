const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    stripeCustomerId: {
      type: String,
      required: true,
    },
    stripeSubscriptionId: {
      type: String,
      required: true,
    },
    stripePriceId: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ['pro', 'enterprise'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'active',
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    trialStart: Date,
    trialEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: Date,
    pricing: {
      amount: {
        type: Number,
        required: true, // Amount in cents
      },
      currency: {
        type: String,
        default: 'usd',
      },
    },
    paymentMethod: {
      type: String, // Stripe payment method ID
      required: true,
    },
    lastPaymentDate: Date,
    nextPaymentDate: Date,
    failedPaymentAttempts: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Check if subscription is active and not expired
subscriptionSchema.methods.isActive = function() {
  return this.status === 'active' && new Date() < this.currentPeriodEnd;
};

// Check if subscription is in trial period
subscriptionSchema.methods.isInTrial = function() {
  return this.status === 'trialing' && this.trialEnd && new Date() < this.trialEnd;
};

// Get plan details
subscriptionSchema.methods.getPlanDetails = function() {
  const planDetails = {
    pro: {
      name: 'Pro Plan', 
      maxTeamMembers: 50,
      maxRecipes: 200,
      monthlyPrice: 4900, // $49.00
      yearlyPrice: 49000, // $490.00 (2 months free)
    },
    enterprise: {
      name: 'Enterprise Plan',
      maxTeamMembers: -1, // Unlimited
      maxRecipes: -1, // Unlimited
      monthlyPrice: 9900, // $99.00
      yearlyPrice: 99000, // $990.00 (2 months free)
    },
  };
  
  return planDetails[this.planType];
};

// Calculate next billing date
subscriptionSchema.methods.getNextBillingDate = function() {
  return this.currentPeriodEnd;
};

module.exports = mongoose.model('Subscription', subscriptionSchema);