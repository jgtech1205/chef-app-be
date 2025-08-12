const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_HEAD_CHEF_ID = process.env.TEST_HEAD_CHEF_ID || '64f8a1b2c3d4e5f6a7b8c9d0';

async function testTeamRegistration() {
  console.log('🧪 Testing Team Member Registration Endpoint');
  console.log('============================================\n');

  try {
    // Test 1: Successful team member registration
    console.log('👨‍🍳 Testing Team Member Registration...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    const testData = {
      headChefId: TEST_HEAD_CHEF_ID,
      firstName: 'John',
      lastName: 'Doe'
    };
    
    console.log('Request Body:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Test 2: Test with invalid head chef ID
    console.log('\n👨‍🍳 Testing with invalid head chef ID...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    const invalidHeadChefData = {
      headChefId: 'invalid-head-chef-id',
      firstName: 'Jane',
      lastName: 'Smith'
    };
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, invalidHeadChefData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Test with missing required fields
    console.log('\n👨‍🍳 Testing with missing required fields...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    const missingFieldsData = {
      headChefId: TEST_HEAD_CHEF_ID,
      firstName: 'Bob'
      // lastName is missing
    };
    
    try {
      const missingFieldsResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, missingFieldsData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 4: Test with empty fields
    console.log('\n👨‍🍳 Testing with empty fields...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    const emptyFieldsData = {
      headChefId: TEST_HEAD_CHEF_ID,
      firstName: '',
      lastName: ''
    };
    
    try {
      const emptyFieldsResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, emptyFieldsData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 5: Test duplicate request (same name for same head chef)
    console.log('\n👨‍🍳 Testing duplicate request...');
    console.log(`POST ${BASE_URL}/api/chefs/request-access`);
    
    const duplicateData = {
      headChefId: TEST_HEAD_CHEF_ID,
      firstName: 'John',
      lastName: 'Doe'
    };
    
    try {
      const duplicateResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, duplicateData, {
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
  testTeamRegistration();
}

module.exports = { testTeamRegistration };
