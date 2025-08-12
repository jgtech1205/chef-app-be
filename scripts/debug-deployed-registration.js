const axios = require('axios');

// Configuration - Update this to your deployed API URL
const BASE_URL = process.env.API_URL || 'https://your-deployed-api.com';

async function debugDeployedRegistration() {
  console.log('🔍 Debugging Registration on Deployed Environment');
  console.log('================================================\n');
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

  // Test 2: Test regular registration endpoint
  console.log('\n📝 Testing Regular Registration Endpoint...');
  console.log(`POST ${BASE_URL}/api/auth/register`);
  
  const regularRegData = {
    email: `test.${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
    role: 'user'
  };
  
  console.log('Request Body:', JSON.stringify(regularRegData, null, 2));
  
  try {
    const regularResponse = await axios.post(`${BASE_URL}/api/auth/register`, regularRegData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
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

  // Test 3: Test team member registration endpoint
  console.log('\n👨‍🍳 Testing Team Member Registration Endpoint...');
  console.log(`POST ${BASE_URL}/api/chefs/request-access`);
  
  const teamRegData = {
    headChefId: '64f8a1b2c3d4e5f6a7b8c9d0', // Example head chef ID
    firstName: 'james',
    lastName: 'bonds'
  };
  
  console.log('Request Body:', JSON.stringify(teamRegData, null, 2));
  
  try {
    const teamResponse = await axios.post(`${BASE_URL}/api/chefs/request-access`, teamRegData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Team Registration Successful:');
    console.log('Status:', teamResponse.status);
    console.log('Response:', JSON.stringify(teamResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Team Registration Failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
    if (error.response?.data.errors) {
      console.log('Validation Errors:', JSON.stringify(error.response.data.errors, null, 2));
    }
  }

  // Test 4: Test what the frontend form might be sending
  console.log('\n🎯 Testing Frontend Form Data...');
  console.log('Simulating what the form with "james" and "bonds" might send');
  
  const frontendData = {
    firstName: 'james',
    lastName: 'bonds'
    // Missing required fields
  };
  
  console.log('Request Body:', JSON.stringify(frontendData, null, 2));
  
  try {
    const frontendResponse = await axios.post(`${BASE_URL}/api/auth/register`, frontendData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Unexpected Success:', frontendResponse.data);
  } catch (error) {
    console.log('❌ Expected Error (Missing Required Fields):');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
    if (error.response?.data.errors) {
      console.log('Validation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`  - ${err.param}: ${err.msg}`);
      });
    }
  }

  // Test 5: Test with different field combinations
  console.log('\n🔧 Testing Different Field Combinations...');
  
  const combinations = [
    {
      name: 'Complete regular registration',
      data: {
        email: `complete.${Date.now()}@example.com`,
        password: 'password123',
        name: 'James Bonds'
      },
      endpoint: '/api/auth/register'
    },
    {
      name: 'Team registration with valid head chef',
      data: {
        headChefId: '64f8a1b2c3d4e5f6a7b8c9d0',
        firstName: 'James',
        lastName: 'Bonds'
      },
      endpoint: '/api/chefs/request-access'
    },
    {
      name: 'Mixed fields (what frontend might send)',
      data: {
        email: `mixed.${Date.now()}@example.com`,
        password: 'password123',
        firstName: 'James',
        lastName: 'Bonds'
      },
      endpoint: '/api/auth/register'
    }
  ];

  for (const test of combinations) {
    console.log(`\n📋 Testing: ${test.name}`);
    console.log(`POST ${BASE_URL}${test.endpoint}`);
    console.log('Data:', JSON.stringify(test.data, null, 2));
    
    try {
      const response = await axios.post(`${BASE_URL}${test.endpoint}`, test.data, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Success:');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ Failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
    }
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
    console.log('API_URL=https://your-deployed-api.com node scripts/debug-deployed-registration.js');
    console.log('');
  }
  
  debugDeployedRegistration();
}

module.exports = { debugDeployedRegistration };
