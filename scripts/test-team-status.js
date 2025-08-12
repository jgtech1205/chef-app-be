const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_CHEF_ID = process.env.TEST_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d2';

async function testTeamStatus() {
  console.log('🧪 Testing Team Member Status Endpoint');
  console.log('=====================================\n');

  try {
    // Test 1: Get team member status with valid ID
    console.log('👨‍🍳 Testing Team Member Status...');
    console.log(`GET ${BASE_URL}/api/chefs/${TEST_CHEF_ID}`);
    
    const response = await axios.get(`${BASE_URL}/api/chefs/${TEST_CHEF_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Test 2: Test with invalid chef ID
    console.log('\n👨‍🍳 Testing with invalid chef ID...');
    console.log(`GET ${BASE_URL}/api/chefs/invalid-chef-id`);
    
    try {
      const invalidResponse = await axios.get(`${BASE_URL}/api/chefs/invalid-chef-id`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Test with non-existent chef ID
    console.log('\n👨‍🍳 Testing with non-existent chef ID...');
    console.log(`GET ${BASE_URL}/api/chefs/64f8a1b2c3d4e5f6a7b8c9d9`);
    
    try {
      const nonExistentResponse = await axios.get(`${BASE_URL}/api/chefs/64f8a1b2c3d4e5f6a7b8c9d9`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Test with malformed ID
    console.log('\n👨‍🍳 Testing with malformed ID...');
    console.log(`GET ${BASE_URL}/api/chefs/123`);
    
    try {
      const malformedResponse = await axios.get(`${BASE_URL}/api/chefs/123`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
if (require.main === module) {
  testTeamStatus();
}

module.exports = { testTeamStatus };
