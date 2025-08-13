const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('../database/models/User');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chef-app');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Parse name into firstName and lastName
function parseName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: 'Unknown', lastName: 'User' };
  }

  const nameParts = fullName.trim().split(' ');
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: 'User' };
  }
  
  if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] };
  }
  
  // For names with more than 2 parts, put everything after first name as last name
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');
  
  return { firstName, lastName };
}

// Migration function
async function migrateUserNames() {
  try {
    console.log('🔄 Starting user name migration...\n');

    // Find all users without firstName/lastName fields
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`Processing: ${user.email || user.name}`);
        
        // Skip if already has firstName and lastName
        if (user.firstName && user.lastName) {
          console.log(`  ⏭️  Already has firstName/lastName: ${user.firstName} ${user.lastName}`);
          skippedCount++;
          continue;
        }

        // Parse the existing name
        const { firstName, lastName } = parseName(user.name);
        
        console.log(`  📝 Parsed name: ${firstName} ${lastName} (from: "${user.name}")`);

        // Update user with firstName and lastName
        user.firstName = firstName;
        user.lastName = lastName;
        
        // Update role if it's "user" to "team-member"
        if (user.role === 'user') {
          user.role = 'team-member';
          console.log(`  🔄 Updated role from "user" to "team-member"`);
        }
        
        await user.save();
        
        console.log(`  ✅ Updated successfully`);
        updatedCount++;

      } catch (error) {
        console.error(`  ❌ Error updating ${user.email || user.name}:`, error.message);
        errorCount++;
      }
      
      console.log('');
    }

    // Summary
    console.log('🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`  ✅ Updated: ${updatedCount} users`);
    console.log(`  ⏭️  Skipped: ${skippedCount} users (already had firstName/lastName)`);
    console.log(`  ❌ Errors: ${errorCount} users`);

    // Show some examples
    const sampleUsers = await User.find({}).limit(5);
    console.log(`\n📋 Sample users with firstName/lastName:`);
    sampleUsers.forEach(user => {
      console.log(`  ${user.email} → ${user.firstName} ${user.lastName} (${user.role})`);
    });

    // Test the new static method
    console.log(`\n🧪 Testing new static methods:`);
    const testUser = await User.findOne({ role: 'team-member' });
    if (testUser) {
      console.log(`  Testing findTeamMember for: ${testUser.firstName} ${testUser.lastName}`);
      const foundUser = await User.findTeamMember(testUser.firstName, testUser.lastName, testUser.organization);
      if (foundUser) {
        console.log(`  ✅ findTeamMember works correctly`);
      } else {
        console.log(`  ❌ findTeamMember failed`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
async function runMigration() {
  await connectDB();
  await migrateUserNames();
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateUserNames };
