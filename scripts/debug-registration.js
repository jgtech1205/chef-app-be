const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';

async function debugRegistration() {
  console.log('🔍 Debugging Registration Issue');
  console.log('===============================\n');

  try {
    // Test 1: Regular user registration (what the form might be trying)
    console.log('📝 Testing Regular User Registration...');
    console.log(`POST ${BASE_URL}/api/auth/register`);
    
    const regularRegData = {
      email: 'james.bonds@example.com',
      password: 'password123',
      name: 'James Bonds',
      role: 'user'
    };
    
    console.log('Request Body:', JSON.stringify(regularRegData, null, 2));
    
    try {
      const regularResponse = await axios.post(`${BASE_URL}/api/auth/register`, regularRegData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Regular Registration Successful:');
      console.log('Status:', regularResponse.status);
      console.log('User ID:', regularResponse.data.user.id);
      console.log('Message:', regularResponse.data.message);
    } catch (error) {
      console.log('❌ Regular Registration Failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
      if (error.response?.data.errors) {
        console.log('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }

    // Test 2: Team member registration (what the form should probably be doing)
    console.log('\n👨‍🍳 Testing Team Member Registration...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    // First, we need a head chef ID - let's try to find one
    console.log('\n🔍 Finding a head chef for testing...');
    
    try {
      // Try to get a head chef from the database (this might fail if no head chefs exist)
      const headChefResponse = await axios.get(`${BASE_URL}/api/admin/users?role=head-chef`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (headChefResponse.data.success && headChefResponse.data.data.length > 0) {
        const headChefId = headChefResponse.data.data[0].id;
        console.log('Found head chef ID:', headChefId);
        
        const teamRegData = {
          headChefId: headChefId,
          firstName: 'James',
          lastName: 'Bonds'
        };
        
        console.log('Request Body:', JSON.stringify(teamRegData, null, 2));
        
        const teamResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, teamRegData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Team Registration Successful:');
        console.log('Status:', teamResponse.status);
        console.log('Response:', JSON.stringify(teamResponse.data, null, 2));
      } else {
        console.log('❌ No head chefs found in database');
      }
    } catch (error) {
      console.log('❌ Could not find head chef:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
    }

    // Test 3: Test with invalid data
    console.log('\n❌ Testing Invalid Registration Data...');
    
    const invalidData = {
      firstName: 'James',
      lastName: 'Bonds'
      // Missing headChefId
    };
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, invalidData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error (Invalid Data):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
      if (error.response?.data.errors) {
        console.log('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
      }
    }

    // Test 4: Test with non-existent head chef
    console.log('\n❌ Testing Non-existent Head Chef...');
    
    const nonExistentData = {
      headChefId: '507f1f77bcf86cd799439011', // Random MongoDB ObjectId
      firstName: 'James',
      lastName: 'Bonds'
    };
    
    try {
      const nonExistentResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, nonExistentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error (Non-existent Head Chef):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the debug
if (require.main === module) {
  debugRegistration();
}

module.exports = { debugRegistration };
