const axios = require('axios');

// Configuration - Update this to your deployed API URL
const BASE_URL = process.env.API_URL || 'https://your-deployed-api.com';

async function debugTeamRegistration() {
  console.log('🔍 Debugging Team Member Registration');
  console.log('=====================================\n');
  console.log('API URL:', BASE_URL);
  console.log('');

  // Test 1: Check if the API is reachable
  console.log('🌐 Testing API Connectivity...');
  try {
    const healthCheck = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ API is reachable');
  } catch (error) {
    console.log('❌ API connectivity issue:');
    console.log('Error:', error.message);
    console.log('Please check your API_URL environment variable');
    return;
  }

  // Test 2: Test team member registration with missing headChefId
  console.log('\n📝 Testing Team Registration - Missing headChefId...');
  console.log('This is likely what the frontend is sending');
  
  const missingHeadChefData = {
    firstName: 'james',
    lastName: 'bonds'
    // Missing headChefId
  };
  
  console.log('Request Body:', JSON.stringify(missingHeadChefData, null, 2));
  console.log(`POST ${BASE_URL}/api/chefs/request-access`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, missingHeadChefData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Unexpected Success:', response.data);
  } catch (error) {
    console.log('❌ Expected Error (Missing headChefId):');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
    if (error.response?.data.errors) {
      console.log('Validation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.param}: ${err.msg}`);
      });
    }
  }

  // Test 3: Test team member registration with invalid headChefId
  console.log('\n📝 Testing Team Registration - Invalid headChefId...');
  
  const invalidHeadChefData = {
    headChefId: 'invalid-id',
    firstName: 'james',
    lastName: 'bonds'
  };
  
  console.log('Request Body:', JSON.stringify(invalidHeadChefData, null, 2));
  console.log(`POST ${BASE_URL}/api/chefs/request-access`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, invalidHeadChefData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Unexpected Success:', response.data);
  } catch (error) {
    console.log('❌ Expected Error (Invalid headChefId):');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
  }

  // Test 4: Test team member registration with valid headChefId
  console.log('\n📝 Testing Team Registration - Valid headChefId...');
  
  const validHeadChefData = {
    headChefId: '64f8a1b2c3d4e5f6a7b8c9d0', // Example head chef ID
    firstName: 'james',
    lastName: 'bonds'
  };
  
  console.log('Request Body:', JSON.stringify(validHeadChefData, null, 2));
  console.log(`POST ${BASE_URL}/api/chefs/request-access`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, validHeadChefData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Team Registration Success:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Team Registration Failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
    if (error.response?.data.errors) {
      console.log('Validation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.param}: ${err.msg}`);
      });
    }
  }

  // Test 5: Test what happens if frontend calls wrong endpoint
  console.log('\n📝 Testing Wrong Endpoint (/api/auth/register)...');
  console.log('This might be what the frontend is actually doing');
  
  const wrongEndpointData = {
    firstName: 'james',
    lastName: 'bonds'
  };
  
  console.log('Request Body:', JSON.stringify(wrongEndpointData, null, 2));
  console.log(`POST ${BASE_URL}/api/auth/register`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, wrongEndpointData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Unexpected Success:', response.data);
  } catch (error) {
    console.log('❌ Expected Error (Wrong endpoint):');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
    if (error.response?.data.errors) {
      console.log('Validation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.param}: ${err.msg}`);
      });
    }
  }

  // Test 6: Test duplicate registration
  console.log('\n📝 Testing Duplicate Registration...');
  
  const duplicateData = {
    headChefId: '64f8a1b2c3d4e5f6a7b8c9d0',
    firstName: 'james',
    lastName: 'bonds'
  };
  
  console.log('Request Body:', JSON.stringify(duplicateData, null, 2));
  console.log(`POST ${BASE_URL}/api/chefs/request-access (second time)`);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, duplicateData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Duplicate Registration Success:', response.data);
  } catch (error) {
    console.log('❌ Expected Error (Duplicate):');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
  }
}

// Run the debug
if (require.main === module) {
  // Check if API_URL is set
  if (!process.env.API_URL) {
    console.log('⚠️  No API_URL environment variable set');
    console.log('Please set your deployed API URL:');
    console.log('export API_URL=https://your-deployed-api.com');
    console.log('');
    console.log('Or run with:');
    console.log('API_URL=https://your-deployed-api.com node scripts/debug-team-registration.js');
    console.log('');
  }
  
  debugTeamRegistration();
}

module.exports = { debugTeamRegistration };
