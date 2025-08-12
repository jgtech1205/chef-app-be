const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_ORG_ID = process.env.TEST_ORG_ID || 'test-restaurant-123';

async function testQRAuth() {
  console.log('🧪 Testing QR Authentication Endpoint');
  console.log('=====================================\n');

  try {
    // Test 1: QR Authentication with organization ID
    console.log('📱 Testing QR Authentication...');
    console.log(`POST ${BASE_URL}/api/auth/qr/${TEST_ORG_ID}`);
    
    const response = await axios.post(`${BASE_URL}/api/auth/qr/${TEST_ORG_ID}`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Test 2: Test with invalid organization ID
    console.log('\n📱 Testing with invalid organization ID...');
    console.log(`POST ${BASE_URL}/api/auth/qr/invalid-org-id`);
    
    try {
      const invalidResponse = await axios.post(`${BASE_URL}/api/auth/qr/invalid-org-id`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error Response:');
      console.log('Status:', error.response?.status);
      console.log('Response:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 3: Test with suspended restaurant (if you have one)
    console.log('\n📱 Testing with suspended restaurant...');
    console.log(`POST ${BASE_URL}/api/auth/qr/suspended-restaurant`);
    
    try {
      const suspendedResponse = await axios.post(`${BASE_URL}/api/auth/qr/suspended-restaurant`, {}, {
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
  testQRAuth();
}

module.exports = { testQRAuth };
