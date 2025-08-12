const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_HEAD_CHEF_ID = process.env.TEST_HEAD_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d0';
const TEST_CHEF_ID = process.env.TEST_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d2';

async function testTeamLogin() {
  console.log('🧪 Testing Team Member Login Endpoint');
  console.log('=====================================\n');

  try {
    // Test 1: Team member login with valid IDs
    console.log('👨‍🍳 Testing Team Member Login...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_HEAD_CHEF_ID}/${TEST_CHEF_ID}`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login/${TEST_HEAD_CHEF_ID}/${TEST_CHEF_ID}`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Test 2: Test with invalid chef ID
    console.log('\n👨‍🍳 Testing with invalid chef ID...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_HEAD_CHEF_ID}/invalid-chef-id`);
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/auth/login/${TEST_HEAD_CHEF_ID}/invalid-chef-id`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Test with invalid head chef ID
    console.log('\n👨‍🍳 Testing with invalid head chef ID...');
    console.log(`POST ${BASE_URL}/api/auth/login/invalid-head-chef-id/${TEST_CHEF_ID}`);
    
    try {
      const invalidHeadChefResponse = await axios.post(`${BASE_URL}/api/auth/login/invalid-head-chef-id/${TEST_CHEF_ID}`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Test with mismatched head chef and chef IDs
    console.log('\n👨‍🍳 Testing with mismatched IDs...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_CHEF_ID}/${TEST_HEAD_CHEF_ID}`);
    
    try {
      const mismatchedResponse = await axios.post(`${BASE_URL}/api/auth/login/${TEST_CHEF_ID}/${TEST_HEAD_CHEF_ID}`, {}, {
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
  testTeamLogin();
}

module.exports = { testTeamLogin };
