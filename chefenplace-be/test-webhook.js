const fetch = require('node-fetch');

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint...');
    
    const response = await fetch('http://localhost:5001/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'test-session-id',
            metadata: {
              restaurantName: 'Test Restaurant',
              headChefEmail: 'test@example.com',
              headChefName: 'Test Chef',
              headChefPassword: 'testpassword123',
              restaurantType: 'fast-casual',
              planType: 'trial',
              billingCycle: 'monthly',
              address: '123 Test St',
              city: 'Test City',
              state: 'TS',
              zipCode: '12345',
              country: 'US'
            }
          }
        }
      })
    });

    console.log('Response status:', response.status);
    const result = await response.text();
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWebhook(); 