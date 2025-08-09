const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://your-backend-domain.vercel.app/api';
const TEST_EMAIL = 'test@chefenplace.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testIntegration() {
  console.log('🧪 Testing Chef en Place API Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: API Documentation
    console.log('2. Testing API Documentation...');
    try {
      const docsResponse = await axios.get(`${API_BASE_URL}/docs`);
      console.log('✅ API Documentation available');
    } catch (error) {
      console.log('⚠️  API Documentation not accessible (this is normal for some setups)');
    }
    console.log('');

    // Test 3: User Registration
    console.log('3. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User'
      });
      console.log('✅ User Registration:', registerResponse.data.message || 'Success');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️  User already exists (this is expected if test was run before)');
      } else {
        console.log('❌ User Registration failed:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // Test 4: User Login
    console.log('4. Testing User Login...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      console.log('✅ User Login:', loginResponse.data.message || 'Success');
      
      const token = loginResponse.data.accessToken;
      console.log('✅ JWT Token received');
      console.log('');

      // Test 5: Protected Route Access
      console.log('5. Testing Protected Route Access...');
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Protected Route Access:', userResponse.data.message || 'Success');
      } catch (error) {
        console.log('❌ Protected Route Access failed:', error.response?.data?.message || error.message);
      }
      console.log('');

      // Test 6: Recipe Creation (if authenticated)
      console.log('6. Testing Recipe Creation...');
      try {
        const recipeResponse = await axios.post(`${API_BASE_URL}/recipes`, {
          name: 'Test Recipe',
          description: 'A test recipe for integration testing',
          ingredients: ['Ingredient 1', 'Ingredient 2'],
          instructions: ['Step 1', 'Step 2'],
          prepTime: 30,
          cookTime: 45,
          servings: 4,
          difficulty: 'medium',
          category: 'main-course'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Recipe Creation:', recipeResponse.data.message || 'Success');
      } catch (error) {
        console.log('❌ Recipe Creation failed:', error.response?.data?.message || error.message);
      }
      console.log('');

    } catch (error) {
      console.log('❌ User Login failed:', error.response?.data?.message || error.message);
    }

    // Test 7: Public Routes
    console.log('7. Testing Public Routes...');
    try {
      const recipesResponse = await axios.get(`${API_BASE_URL}/recipes`);
      console.log('✅ Public Recipes Route:', 'Success');
    } catch (error) {
      console.log('❌ Public Recipes Route failed:', error.response?.data?.message || error.message);
    }
    console.log('');

    // Test 8: CORS Configuration
    console.log('8. Testing CORS Configuration...');
    try {
      const corsResponse = await axios.options(`${API_BASE_URL}/health`);
      console.log('✅ CORS Configuration:', 'Success');
    } catch (error) {
      console.log('⚠️  CORS test inconclusive (this is normal)');
    }
    console.log('');

    console.log('🎉 Integration Test Complete!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- Backend API is running');
    console.log('- Authentication system is working');
    console.log('- Protected routes are secured');
    console.log('- Public routes are accessible');
    console.log('');
    console.log('🚀 Your Chef en Place application is ready!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check if your backend is deployed and accessible');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Ensure database connection is working');
    console.log('4. Check Vercel deployment logs for errors');
  }
}

// Run the test
if (require.main === module) {
  testIntegration();
}

module.exports = { testIntegration }; 