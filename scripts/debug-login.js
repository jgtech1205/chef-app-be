const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5002';
const TEST_EMAIL = process.env.TEST_EMAIL || 'headchef@restaurant.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

async function debugLogin() {
  console.log('🔍 Debugging Login Issue');
  console.log('========================\n');

  try {
    // Test 1: Basic login attempt
    console.log('📝 Testing Login...');
    console.log(`POST ${BASE_URL}/api/auth/login`);
    console.log('Email:', TEST_EMAIL);
    console.log('Password length:', TEST_PASSWORD.length);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login Successful:');
    console.log('Status:', response.status);
    console.log('User ID:', response.data.user.id);
    console.log('User Role:', response.data.user.role);
    console.log('User Status:', response.data.user.status);
    console.log('Is Active:', response.data.user.isActive);
    console.log('Access Token Length:', response.data.accessToken.length);
    console.log('Refresh Token Length:', response.data.refreshToken.length);

    // Test 2: Test logout
    console.log('\n🚪 Testing Logout...');
    console.log(`POST ${BASE_URL}/api/auth/logout`);
    
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${response.data.accessToken}`
      }
    });

    console.log('✅ Logout Successful:');
    console.log('Status:', logoutResponse.status);
    console.log('Message:', logoutResponse.data.message);

    // Test 3: Try logging back in immediately
    console.log('\n🔄 Testing Login After Logout...');
    console.log(`POST ${BASE_URL}/api/auth/login`);
    
    const reloginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Re-login Successful:');
    console.log('Status:', reloginResponse.status);
    console.log('User ID:', reloginResponse.data.user.id);
    console.log('New Access Token Length:', reloginResponse.data.accessToken.length);

    // Test 4: Test with wrong password
    console.log('\n❌ Testing Wrong Password...');
    console.log(`POST ${BASE_URL}/api/auth/login`);
    
    try {
      const wrongPasswordResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error (Wrong Password):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
    }

    // Test 5: Test with non-existent email
    console.log('\n❌ Testing Non-existent Email...');
    console.log(`POST ${BASE_URL}/api/auth/login`);
    
    try {
      const wrongEmailResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.log('❌ Expected Error (Non-existent Email):');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data.message);
    }

    // Test 6: Test token refresh
    console.log('\n🔄 Testing Token Refresh...');
    console.log(`POST ${BASE_URL}/api/auth/refresh-token`);
    
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh-token`, {
      refreshToken: response.data.refreshToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Token Refresh Successful:');
    console.log('Status:', refreshResponse.status);
    console.log('New Access Token Length:', refreshResponse.data.accessToken.length);
    console.log('New Refresh Token Length:', refreshResponse.data.refreshToken.length);

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
  debugLogin();
}

module.exports = { debugLogin };
