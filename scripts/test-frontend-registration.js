const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';

async function testFrontendRegistration() {
  console.log('🔍 Testing Frontend Registration Form');
  console.log('=====================================\n');

  // Based on the image, the form has "james" and "bonds" fields
  // Let's test different possible scenarios

  console.log('📝 Scenario 1: Testing /api/auth/register with minimal data...');
  console.log('This might be what the frontend is trying to do');
  
  const minimalData = {
    firstName: 'james',
    lastName: 'bonds'
    // Missing required fields: email, password, name
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, minimalData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Unexpected Success:', response.data);
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

  console.log('\n📝 Scenario 2: Testing /api/auth/register with complete data...');
  
  const completeData = {
    email: 'james.bonds@example.com',
    password: 'password123',
    name: 'James Bonds',
    firstName: 'james',
    lastName: 'bonds'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, completeData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Registration Success:', response.data.message);
  } catch (error) {
    console.log('❌ Registration Failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
  }

  console.log('\n📝 Scenario 3: Testing /api/chefs/request-access (Team Member Registration)...');
  console.log('This is likely what the form should be doing');
  
  const teamData = {
    headChefId: '64f8a1b2c3d4e5f6a7b8c9d0', // Example head chef ID
    firstName: 'james',
    lastName: 'bonds'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chefs/request-access`, teamData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Team Registration Success:');
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

  console.log('\n📝 Scenario 4: Testing with different field names...');
  console.log('Maybe the frontend is using different field names');
  
  const alternativeData = {
    first_name: 'james',
    last_name: 'bonds',
    email: 'james.bonds@example.com',
    password: 'password123'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, alternativeData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Alternative Registration Success:', response.data.message);
  } catch (error) {
    console.log('❌ Alternative Registration Failed:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data.message);
  }
}

// Run the test
if (require.main === module) {
  testFrontendRegistration();
}

module.exports = { testFrontendRegistration };
