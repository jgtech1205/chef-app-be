const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'SuperAdmin123!';
  
  console.log('🔍 Testing bcrypt with password:', password);
  
  // Create a new hash
  const newHash = await bcrypt.hash(password, 12);
  console.log('🔐 New hash:', newHash);
  
  // Test if the new hash matches the password
  const newMatch = await bcrypt.compare(password, newHash);
  console.log('✅ New hash matches password:', newMatch);
  
  // Get the existing hash from database and test
  const mongoose = require('mongoose');
  const User = require('./database/models/User');
  require('dotenv').config();
  
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chef-en-place');
  const admin = await User.findOne({ email: 'admin@chefenplace.com' });
  
  console.log('🔐 Existing hash:', admin.password);
  console.log('🔍 Testing existing hash...');
  const existingMatch = await bcrypt.compare(password, admin.password);
  console.log('❌ Existing hash matches password:', existingMatch);
  
  // Let's also test with different possible passwords
  const testPasswords = [
    'SuperAdmin123!',
    'SuperAdmin123',
    'superadmin123!',
    'admin123',
    'SuperAdmin123!'
  ];
  
  console.log('🔍 Testing various password combinations...');
  for (const testPwd of testPasswords) {
    const match = await bcrypt.compare(testPwd, admin.password);
    console.log(`🔑 "${testPwd}" -> ${match}`);
  }
  
  await mongoose.disconnect();
}

testBcrypt().catch(console.error);