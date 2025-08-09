const mongoose = require('mongoose');
const User = require('./database/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./database/connection');

async function testPassword(email, testPassword) {
  try {
    // Connect to database
    await connectDB();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      mongoose.connection.close();
      return;
    }
    
    console.log('User found:', {
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isActive: user.isActive,
      passwordHash: user.password.substring(0, 20) + '...'
    });
    
    // Test password comparison
    const isMatch = await user.comparePassword(testPassword);
    console.log('Password comparison result:', isMatch);
    
    // Also test with bcrypt directly
    const directMatch = await bcrypt.compare(testPassword, user.password);
    console.log('Direct bcrypt comparison:', directMatch);
    
    // Test with a known password
    const testHash = await bcrypt.hash('password123', 12);
    const testMatch = await bcrypt.compare('password123', testHash);
    console.log('Test hash comparison:', testMatch);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error testing password:', error);
    mongoose.connection.close();
  }
}

// Test password for bjteddy777@gmail.com
testPassword('bjteddy777@gmail.com', 'password123'); 