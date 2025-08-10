const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    organization: {
      type: String,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
      password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super-admin", "head-chef", "user"],
      default: "user",
    },
    headChef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "active",
    },
    savedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    avatar: {
      type: String,
      default: null,
    },
    permissions: {
      // Recipe permissions
      canViewRecipes: { type: Boolean, default: false },
      canEditRecipes: { type: Boolean, default: false },
      canDeleteRecipes: { type: Boolean, default: false },
      canUpdateRecipes: { type: Boolean, default: false },

      // Plateup permissions
      canViewPlateups: { type: Boolean, default: false },
      canCreatePlateups: { type: Boolean, default: false },
      canDeletePlateups: { type: Boolean, default: false },
      canUpdatePlateups: { type: Boolean, default: false },

      // Notification permissions
      canViewNotifications: { type: Boolean, default: false },
      canCreateNotifications: { type: Boolean, default: false },
      canDeleteNotifications: { type: Boolean, default: false },
      canUpdateNotifications: { type: Boolean, default: false },

      // Panel permissions
      canViewPanels: { type: Boolean, default: false },
      canCreatePanels: { type: Boolean, default: false },
      canDeletePanels: { type: Boolean, default: false },
      canUpdatePanels: { type: Boolean, default: false },

      // Other
      canManageTeam: { type: Boolean, default: false },
      canAccessAdmin: { type: Boolean, default: false },
    },
    preferences: {
      language: {
        type: String,
        default: "English",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // QR Access fields
    qrAccess: {
      type: Boolean,
      default: false,
    },
    qrAccessDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Set permissions based on role
userSchema.pre("save", function (next) {
  if (this.isModified("role")) {
    switch (this.role) {
      case "head-chef":
        this.permissions = {
          // Recipes
          canViewRecipes: true,
          canEditRecipes: true,
          canDeleteRecipes: true,
          canUpdateRecipes: true,

          // Plateups
          canViewPlateups: true,
          canCreatePlateups: true,
          canDeletePlateups: true,
          canUpdatePlateups: true,

          // Notifications
          canViewNotifications: true,
          canCreateNotifications: true,
          canDeleteNotifications: true,
          canUpdateNotifications: true,

          // Panels
          canViewPanels: true,
          canCreatePanels: true,
          canDeletePanels: true,
          canUpdatePanels: true,

          // Other
          canManageTeam: true,
          canAccessAdmin: true,
        }
        break;
    }
  }
  next()
})

module.exports = mongoose.model("User", userSchema)
