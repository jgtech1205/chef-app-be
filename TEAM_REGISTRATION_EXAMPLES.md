# Team Member Registration - Testing Examples

## Using curl

### Test Team Member Registration with Valid Data

```bash
# Replace with actual head chef ID from your database
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Expected Success Response (201 Created)

```json
{
  "id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "status": "pending",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

### Test with Invalid Head Chef ID

```bash
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "invalid-head-chef-id",
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Expected Response (400):**
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-head-chef-id",
      "msg": "Invalid value",
      "path": "headChefId",
      "location": "body"
    }
  ]
}
```

### Test with Missing Required Fields

```bash
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "Bob"
  }'
```

**Expected Response (400):**
```json
{
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Invalid value",
      "path": "lastName",
      "location": "body"
    }
  ]
}
```

### Test with Empty Fields

```bash
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "",
    "lastName": ""
  }'
```

**Expected Response (400):**
```json
{
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Invalid value",
      "path": "firstName",
      "location": "body"
    },
    {
      "type": "field",
      "value": "",
      "msg": "Invalid value",
      "path": "lastName",
      "location": "body"
    }
  ]
}
```

### Test Duplicate Request

```bash
# First request
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "Alice",
    "lastName": "Johnson"
  }'

# Second request with same name and head chef
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "Alice",
    "lastName": "Johnson"
  }'
```

**Expected Response (400):**
```json
{
  "message": "You have already requested access"
}
```

### Test with Non-existent Head Chef

```bash
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d9",
    "firstName": "Charlie",
    "lastName": "Brown"
  }'
```

**Expected Response (404):**
```json
{
  "message": "Head chef not found"
}
```

## Using JavaScript/Fetch

```javascript
// Test team member registration
async function testTeamRegistration(headChefId, firstName, lastName) {
  try {
    const response = await fetch('http://localhost:5002/api/chefs/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        headChefId,
        firstName,
        lastName
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration Successful:', data);
      
      // Store request details
      localStorage.setItem('requestId', data.id);
      localStorage.setItem('requestStatus', data.status);
      localStorage.setItem('userId', data.userId);
      
      return data;
    } else {
      console.log('❌ Registration Failed:', data);
      
      if (response.status === 400) {
        if (data.message === 'You have already requested access') {
          console.log('⚠️ Duplicate request detected');
        } else {
          console.log('⚠️ Validation error:', data.errors);
        }
      } else if (response.status === 404) {
        console.log('⚠️ Head chef not found');
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Usage examples
testTeamRegistration('64f8a1b2c3d4e5f6a7b8c9d0', 'John', 'Doe');
testTeamRegistration('64f8a1b2c3d4e5f6a7b8c9d0', 'Jane', 'Smith');
testTeamRegistration('invalid-id', 'Bob', 'Johnson');
```

## Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:5002/api/chefs/request-access`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "firstName": "John",
  "lastName": "Doe"
}
```

## Testing Different Scenarios

### Scenario 1: Successful Registration
- **Condition:** Valid headChefId, firstName, and lastName
- **Expected:** 201 status with request details

### Scenario 2: Invalid Head Chef ID
- **Condition:** Invalid MongoDB ObjectId format
- **Expected:** 400 status with validation errors

### Scenario 3: Missing Required Fields
- **Condition:** Missing firstName or lastName
- **Expected:** 400 status with validation errors

### Scenario 4: Empty Fields
- **Condition:** Empty firstName or lastName
- **Expected:** 400 status with validation errors

### Scenario 5: Duplicate Request
- **Condition:** Same name for same head chef
- **Expected:** 400 status with duplicate message

### Scenario 6: Non-existent Head Chef
- **Condition:** Valid ObjectId but head chef doesn't exist
- **Expected:** 404 status with "Head chef not found" message

## Environment Setup

Make sure your server is running:

```bash
# Start the server
npm start

# Or if using nodemon
npm run dev
```

## Database Requirements

To test the endpoint, you need:

1. **Head Chef** user with role 'head-chef' and status 'active'
2. **Organization** field set on the head chef user

## Sample Database Entry for Testing

```javascript
// Head Chef (required for testing)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  email: "headchef@restaurant.com",
  name: "Head Chef Name",
  role: "head-chef",
  status: "active",
  isActive: true,
  organization: "restaurant-org-123"
}
```

## Quick Test Commands

```bash
# Test successful registration
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{"headChefId": "64f8a1b2c3d4e5f6a7b8c9d0", "firstName": "John", "lastName": "Doe"}' | jq

# Test validation error
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{"headChefId": "invalid-id", "firstName": "Jane", "lastName": "Smith"}' | jq

# Test missing field
curl -X POST http://localhost:5002/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{"headChefId": "64f8a1b2c3d4e5f6a7b8c9d0", "firstName": "Bob"}' | jq
```

## Integration with QR Codes

This endpoint can be used in combination with QR codes for team member onboarding:

```javascript
// QR code could contain: "team-register:headChefId"
function handleRegistrationQR(qrData) {
  const parts = qrData.split(':');
  if (parts[0] === 'team-register' && parts.length === 2) {
    const headChefId = parts[1];
    
    // Show registration form
    showRegistrationForm(headChefId);
  }
}

function showRegistrationForm(headChefId) {
  // Display form for firstName and lastName
  // Then call requestTeamAccess(headChefId, firstName, lastName)
}
```

## Workflow Testing

1. **Register Team Member**: Use this endpoint to create a pending request
2. **Check Status**: Use the returned userId to check request status
3. **Approve/Reject**: Use head chef endpoints to manage the request
4. **Login**: Once approved, use team member login endpoint
