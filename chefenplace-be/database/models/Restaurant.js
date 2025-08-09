const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['fast-casual', 'fine-dining', 'cafe', 'bakery', 'food-truck', 'catering', 'other'],
      default: 'other',
    },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'US',
      },
    },
    organizationId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    headChef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'suspended', 'cancelled'],
      default: 'trial',
    },
    trialStartDate: {
      type: Date,
      default: Date.now,
    },
    trialEndDate: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
      },
    },
    settings: {
      maxTeamMembers: {
        type: Number,
        default: 10, // Trial limit
      },
      maxRecipes: {
        type: Number,
        default: 10, // Trial limit
      },
      planType: {
        type: String,
        enum: ['trial', 'pro', 'enterprise'],
        default: 'trial',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Check if trial has expired
restaurantSchema.methods.isTrialExpired = function() {
  return this.status === 'trial' && new Date() > this.trialEndDate;
};

// Get current plan limits
restaurantSchema.methods.getPlanLimits = function() {
  const planLimits = {
    trial: { maxTeamMembers: 10, maxRecipes: 10 },
    pro: { maxTeamMembers: 50, maxRecipes: 200 },
    enterprise: { maxTeamMembers: -1, maxRecipes: -1 }, // Unlimited
  };
  
  return planLimits[this.settings.planType] || planLimits.trial;
};

// Update plan and limits
restaurantSchema.methods.updatePlan = function(planType) {
  const limits = this.getPlanLimits();
  this.settings.planType = planType;
  this.settings.maxTeamMembers = limits.maxTeamMembers;
  this.settings.maxRecipes = limits.maxRecipes;
  
  if (planType !== 'trial') {
    this.status = 'active';
  }
};

module.exports = mongoose.model('Restaurant', restaurantSchema);