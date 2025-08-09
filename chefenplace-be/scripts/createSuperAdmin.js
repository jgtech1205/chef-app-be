const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../database/models/User');
require('dotenv').config();

// Script to create the initial Super Admin user
async function createSuperAdmin() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chef-en-place');
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    if (existingSuperAdmin) {
      console.log('Super Admin already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Get super admin details from environment or prompt
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@chefenplace.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    // Check if email is already taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
          console.log('User with this email already exists:', email);
    console.log('Please use a different email for the super admin account');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create super admin user
    const superAdmin = new User({
      email,
      password: hashedPassword,
      name,
      role: 'super-admin',
      organization: 'chefenplace-platform',
      emailVerified: true, // Super admin doesn't need email verification
      status: 'active',
      permissions: {
        // Super admin gets all permissions
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

    await superAdmin.save();

    console.log('Super Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Access URL:', process.env.FRONTEND_URL || 'http://localhost:5173/super-admin');
    console.log('');
    console.log('IMPORTANT: Change the password after first login!');
    console.log('You can now log in and manage all restaurants on the platform.');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createSuperAdmin();