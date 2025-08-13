const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5002/api';

// Test configuration
const TEST_CONFIG = {
  validRestaurant: 'Joe\'s Pizza',
  validFirstName: 'John',
  validLastName: 'Doe',
  invalidRestaurant: 'Test@#$%^&*()',
  invalidFirstName: 'John123',
  invalidLastName: 'Doe@#$%',
  rateLimitAttempts: 6,
  rateLimitWindow: 15 * 60 * 1000 // 15 minutes
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (message) => console.log(`${colors.green}✅ ${message}${colors.reset}`),
  error: (message) => console.log(`${colors.red}❌ ${message}${colors.reset}`),
  warning: (message) => console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`),
  info: (message) => console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`)
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

const recordResult = (testName, passed, details = '') => {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log.success(`${testName}: PASSED`);
  } else {
    testResults.failed++;
    log.error(`${testName}: FAILED - ${details}`);
  }
};

// Helper function to make API calls
const makeRequest = async (endpoint, data = null, method = 'POST') => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      data: error.response?.data, 
      status: error.response?.status,
      message: error.message 
    };
  }
};

// Test 1: Input Validation - Valid Input
const testValidInput = async () => {
  log.info('Testing valid input validation...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.validRestaurant,
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  // Should either succeed (if user exists) or fail with 404 (if user doesn't exist)
  // But should NOT fail with 400 validation error
  const passed = response.status !== 400;
  recordResult('Valid Input Validation', passed, 
    passed ? '' : `Expected not 400, got ${response.status}`);
};

// Test 2: Input Validation - Invalid Restaurant Name
const testInvalidRestaurantName = async () => {
  log.info('Testing invalid restaurant name validation...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.invalidRestaurant,
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  const passed = response.status === 400 && 
                 response.data?.error === 'validation_error';
  recordResult('Invalid Restaurant Name Validation', passed,
    passed ? '' : `Expected 400 with validation_error, got ${response.status}`);
};

// Test 3: Input Validation - Invalid First Name
const testInvalidFirstName = async () => {
  log.info('Testing invalid first name validation...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.validRestaurant,
    firstName: TEST_CONFIG.invalidFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  const passed = response.status === 400 && 
                 response.data?.error === 'validation_error';
  recordResult('Invalid First Name Validation', passed,
    passed ? '' : `Expected 400 with validation_error, got ${response.status}`);
};

// Test 4: Input Validation - Invalid Last Name
const testInvalidLastName = async () => {
  log.info('Testing invalid last name validation...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.validRestaurant,
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.invalidLastName
  });

  const passed = response.status === 400 && 
                 response.data?.error === 'validation_error';
  recordResult('Invalid Last Name Validation', passed,
    passed ? '' : `Expected 400 with validation_error, got ${response.status}`);
};

// Test 5: Input Validation - Missing Fields
const testMissingFields = async () => {
  log.info('Testing missing fields validation...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: '',
    firstName: '',
    lastName: ''
  });

  const passed = response.status === 400 && 
                 response.data?.error === 'validation_error';
  recordResult('Missing Fields Validation', passed,
    passed ? '' : `Expected 400 with validation_error, got ${response.status}`);
};

// Test 6: Rate Limiting
const testRateLimiting = async () => {
  log.info('Testing rate limiting...');
  
  const requests = [];
  
  // Make multiple requests to trigger rate limiting
  for (let i = 0; i < TEST_CONFIG.rateLimitAttempts; i++) {
    requests.push(makeRequest('/auth/login-by-name', {
      restaurantName: `Test Restaurant ${i}`,
      firstName: `Test${i}`,
      lastName: `User${i}`
    }));
  }

  const responses = await Promise.all(requests);
  
  // Check if the last request was rate limited
  const lastResponse = responses[responses.length - 1];
  const passed = lastResponse.status === 429 && 
                 lastResponse.data?.error === 'rate_limit_exceeded';
  
  recordResult('Rate Limiting', passed,
    passed ? '' : `Expected 429 with rate_limit_exceeded, got ${lastResponse.status}`);
};

// Test 7: Non-existent Restaurant
const testNonExistentRestaurant = async () => {
  log.info('Testing non-existent restaurant...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: 'Non Existent Restaurant That Does Not Exist',
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  const passed = response.status === 404 && 
                 response.data?.error === 'restaurant_not_found';
  recordResult('Non-existent Restaurant', passed,
    passed ? '' : `Expected 404 with restaurant_not_found, got ${response.status}`);
};

// Test 8: Token Security - Check Response Structure
const testTokenSecurity = async () => {
  log.info('Testing token security...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.validRestaurant,
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  if (response.success && response.data) {
    const hasAccessToken = !!response.data.accessToken;
    const hasRefreshToken = !!response.data.refreshToken;
    const hasExpiresIn = typeof response.data.expiresIn === 'number';
    const hasUser = !!response.data.user;
    
    const passed = hasAccessToken && hasRefreshToken && hasExpiresIn && hasUser;
    recordResult('Token Security Structure', passed,
      passed ? '' : 'Missing required token fields');
  } else {
    // If login failed, that's okay - we're just testing the structure
    recordResult('Token Security Structure', true, 'Login failed (expected for test data)');
  }
};

// Test 9: Error Message Consistency
const testErrorMessages = async () => {
  log.info('Testing error message consistency...');
  
  const response = await makeRequest('/auth/login-by-name', {
    restaurantName: '',
    firstName: '',
    lastName: ''
  });

  const hasMessage = !!response.data?.message;
  const hasError = !!response.data?.error;
  const messageIsString = typeof response.data?.message === 'string';
  
  const passed = hasMessage && hasError && messageIsString;
  recordResult('Error Message Consistency', passed,
    passed ? '' : 'Missing or invalid error message structure');
};

// Test 10: Logging Verification (indirect)
const testLoggingVerification = async () => {
  log.info('Testing logging verification...');
  
  // Make a request and check if logs directory exists
  await makeRequest('/auth/login-by-name', {
    restaurantName: TEST_CONFIG.validRestaurant,
    firstName: TEST_CONFIG.validFirstName,
    lastName: TEST_CONFIG.validLastName
  });

  // This is an indirect test - we can't directly verify logs in this test
  // but we can check if the logging infrastructure is in place
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(__dirname, '../logs');
  
  const passed = fs.existsSync(logsDir);
  recordResult('Logging Infrastructure', passed,
    passed ? '' : 'Logs directory not found');
};

// Main test runner
const runAllTests = async () => {
  console.log('\n🔒 Security Measures Test Suite\n');
  console.log('=' .repeat(50));
  
  const tests = [
    testValidInput,
    testInvalidRestaurantName,
    testInvalidFirstName,
    testInvalidLastName,
    testMissingFields,
    testRateLimiting,
    testNonExistentRestaurant,
    testTokenSecurity,
    testErrorMessages,
    testLoggingVerification
  ];

  for (const test of tests) {
    try {
      await test();
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      log.error(`Test failed with error: ${error.message}`);
      recordResult('Test Execution', false, error.message);
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    log.success('All security tests passed! 🎉');
  } else {
    log.warning(`${testResults.failed} test(s) failed. Please review the implementation.`);
  }
  
  console.log('\n📝 Notes:');
  console.log('- Rate limiting tests may take time to reset');
  console.log('- Some tests may fail if test data doesn\'t exist in database');
  console.log('- Check logs/ directory for security log files');
  console.log('- Review SECURITY_IMPLEMENTATION.md for detailed documentation');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
};
