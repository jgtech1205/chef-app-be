const axios = require('axios');

const API_BASE = 'http://localhost:5002/api';

async function testTeamMemberLogin() {
  console.log('🧪 Testing Team Member Login System\n');
  
  // Test cases
  const testCases = [
    {
      name: 'Valid Team Member Login',
      data: {
        restaurantName: 'joes-pizza',
        username: 'John',    // First name
        password: 'Doe'      // Last name
      }
    },
    {
      name: 'Invalid Restaurant',
      data: {
        restaurantName: 'non-existent-restaurant',
        username: 'John',
        password: 'Doe'
      }
    },
    {
      name: 'Invalid Credentials',
      data: {
        restaurantName: 'joes-pizza',
        username: 'Wrong',
        password: 'Name'
      }
    },
    {
      name: 'Missing Restaurant Name',
      data: {
        username: 'John',
        password: 'Doe'
      }
    },
    {
      name: 'Missing Username (First Name)',
      data: {
        restaurantName: 'joes-pizza',
        password: 'Doe'
      }
    },
    {
      name: 'Missing Password (Last Name)',
      data: {
        restaurantName: 'joes-pizza',
        username: 'John'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`📤 Request:`, testCase.data);
    
    try {
      const response = await axios.post(`${API_BASE}/auth/login-team-member`, testCase.data);
      console.log(`✅ Success (${response.status}):`, response.data);
    } catch (error) {
      if (error.response) {
        console.log(`❌ Error (${error.response.status}):`, error.response.data);
      } else {
        console.log(`❌ Network Error:`, error.message);
      }
    }
    console.log('─'.repeat(50));
  }
}

// Run the test
testTeamMemberLogin().catch(console.error);
