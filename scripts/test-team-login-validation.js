const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-restaurant-123';
const TEST_HEAD_CHEF_ID = process.env.TEST_HEAD_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d0';
const TEST_CHEF_ID = process.env.TEST_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d2';

async function testTeamLoginValidation() {
  console.log('🧪 Testing Team Member Login Validation');
  console.log('========================================\n');

  try {
    // Test 1: Valid team member login with organization ID
    console.log('👨‍🍳 Testing Valid Team Member Login...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_ORG_ID}/${TEST_CHEF_ID}`);
    console.log('headChefId (organization):', TEST_ORG_ID);
    console.log('chefId (team member):', TEST_CHEF_ID);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login/${TEST_ORG_ID}/${TEST_CHEF_ID}`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('User Role:', response.data.user.role);
    console.log('User Status:', response.data.user.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Test 2: Test with invalid organization ID
    console.log('\n👨‍🍳 Testing with invalid organization ID...');
    console.log(`POST ${BASE_URL}/api/auth/login/invalid-org-id/${TEST_CHEF_ID}`);
    
    try {
      const invalidOrgResponse = await axios.post(`${BASE_URL}/api/auth/login/invalid-org-id/${TEST_CHEF_ID}`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Test with invalid chef ID
    console.log('\n👨‍🍳 Testing with invalid chef ID...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_ORG_ID}/invalid-chef-id`);
    
    try {
      const invalidChefResponse = await axios.post(`${BASE_URL}/api/auth/login/${TEST_ORG_ID}/invalid-chef-id`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Test with mismatched organization and chef
    console.log('\n👨‍🍳 Testing with mismatched organization and chef...');
    console.log(`POST ${BASE_URL}/api/auth/login/different-org-id/${TEST_CHEF_ID}`);
    
    try {
      const mismatchedResponse = await axios.post(`${BASE_URL}/api/auth/login/different-org-id/${TEST_CHEF_ID}`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 5: Test with pending team member
    console.log('\n👨‍🍳 Testing with pending team member...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_ORG_ID}/64f8a1b2c3d4e5f6a7b8c9d3`);
    
    try {
      const pendingResponse = await axios.post(`${BASE_URL}/api/auth/login/${TEST_ORG_ID}/64f8a1b2c3d4e5f6a7b8c9d3`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 6: Test with rejected team member
    console.log('\n👨‍🍳 Testing with rejected team member...');
    console.log(`POST ${BASE_URL}/api/auth/login/${TEST_ORG_ID}/64f8a1b2c3d4e5f6a7b8c9d4`);
    
    try {
      const rejectedResponse = await axios.post(`${BASE_URL}/api/auth/login/${TEST_ORG_ID}/64f8a1b2c3d4e5f6a7b8c9d4`, {}, {
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
  testTeamLoginValidation();
}

module.exports = { testTeamLoginValidation };
