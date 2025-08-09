const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./database/models/User');
require('dotenv').config();

async function fixPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chef-en-place');
    
    const password = 'SuperAdmin123!';
    const newHashedPassword = await bcrypt.hash(password, 12);
    
    console.log('🔧 Fixing super admin password...');
    console.log('🔐 New hash:', newHashedPassword);
    
    // Update the password directly in the database
    const result = await User.updateOne(
      { email: 'admin@chefenplace.com' },
      { password: newHashedPassword }
    );
    
    console.log('📝 Update result:', result);
    
    // Verify the fix worked
    const admin = await User.findOne({ email: 'admin@chefenplace.com' });
    const isMatch = await bcrypt.compare(password, admin.password);
    
    console.log('✅ Password verification after fix:', isMatch);
    
    if (isMatch) {
      console.log('🎉 Password fixed successfully!');
      console.log('📧 Email: admin@chefenplace.com');
      console.log('🔑 Password: SuperAdmin123!');
      console.log('🔗 URL: http://localhost:5173/super-admin');
    } else {
      console.log('❌ Password fix failed');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPassword();