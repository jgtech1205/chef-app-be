const mongoose = require('mongoose');
require('dotenv').config();

// Import the Restaurant model
const Restaurant = require('../database/models/Restaurant');

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

// Generate slug from restaurant name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate unique slug with counter if needed
async function generateUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  while (await Restaurant.findOne(query)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// Migration function
async function migrateRestaurantSlugs() {
  try {
    console.log('🔄 Starting restaurant slug migration...\n');

    // Find all restaurants without slugs
    const restaurants = await Restaurant.find({});
    console.log(`📊 Found ${restaurants.length} restaurants to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      try {
        console.log(`Processing: ${restaurant.name}`);
        
        // Skip if already has a slug
        if (restaurant.slug) {
          console.log(`  ⏭️  Already has slug: ${restaurant.slug}`);
          skippedCount++;
          continue;
        }

        // Generate unique slug
        const baseSlug = generateSlug(restaurant.name);
        const uniqueSlug = await generateUniqueSlug(baseSlug, restaurant._id);
        
        console.log(`  📝 Generated slug: ${uniqueSlug}`);

        // Update restaurant with slug
        restaurant.slug = uniqueSlug;
        await restaurant.save();
        
        console.log(`  ✅ Updated successfully`);
        updatedCount++;

      } catch (error) {
        console.error(`  ❌ Error updating ${restaurant.name}:`, error.message);
        errorCount++;
      }
      
      console.log('');
    }

    // Summary
    console.log('🎉 Migration completed!');
    console.log(`📊 Summary:`);
    console.log(`  ✅ Updated: ${updatedCount} restaurants`);
    console.log(`  ⏭️  Skipped: ${skippedCount} restaurants (already had slugs)`);
    console.log(`  ❌ Errors: ${errorCount} restaurants`);

    // Show some examples
    const sampleRestaurants = await Restaurant.find({}).limit(5);
    console.log(`\n📋 Sample restaurants with slugs:`);
    sampleRestaurants.forEach(restaurant => {
      console.log(`  ${restaurant.name} → ${restaurant.slug}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
async function runMigration() {
  await connectDB();
  await migrateRestaurantSlugs();
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateRestaurantSlugs };
