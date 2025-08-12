# Team Member Status - Testing Examples

## Using curl

### Test Team Member Status with Valid ID

```bash
# Replace with actual chef ID from your database
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json"
```

### Expected Success Response (200 OK)

```json
{
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "status": "pending",
    "name": "John Doe"
  }
}
```

### Test with Pending Team Member

```bash
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "status": "pending",
    "name": "John Doe"
  }
}
```

### Test with Active Team Member

```bash
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d3 \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "status": "active",
    "name": "Jane Smith"
  }
}
```

### Test with Rejected Team Member

```bash
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d4 \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "status": "rejected",
    "name": "Bob Johnson"
  }
}
```

### Test with Invalid Chef ID

```bash
curl -X GET http://localhost:5002/api/chefs/invalid-chef-id \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "User not found"
}
```

### Test with Non-existent Chef ID

```bash
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d9 \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "User not found"
}
```

### Test with Malformed ID

```bash
curl -X GET http://localhost:5002/api/chefs/123 \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "User not found"
}
```

## Using JavaScript/Fetch

```javascript
// Test team member status
async function testTeamStatus(chefId) {
  try {
    const response = await fetch(`http://localhost:5002/api/chefs/${chefId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Team Status Retrieved:', data);
      
      const { id, status, name } = data.data;
      
      // Handle different statuses
      switch (status) {
        case 'pending':
          console.log(`⏳ ${name} is waiting for approval`);
          break;
        case 'active':
          console.log(`✅ ${name} is approved and active`);
          break;
        case 'rejected':
          console.log(`❌ ${name} was rejected`);
          break;
        default:
          console.log(`❓ ${name} has unknown status: ${status}`);
      }
      
      return data.data;
    } else {
      console.log('❌ Failed to get team status:', data);
      
      if (response.status === 404) {
        console.log('⚠️ Team member not found');
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Usage examples
testTeamStatus('64f8a1b2c3d4e5f6a7b8c9d2'); // Pending member
testTeamStatus('64f8a1b2c3d4e5f6a7b8c9d3'); // Active member
testTeamStatus('64f8a1b2c3d4e5f6a7b8c9d4'); // Rejected member
testTeamStatus('invalid-id'); // Invalid ID
```

## Using Postman

1. **Method:** GET
2. **URL:** `http://localhost:5002/api/chefs/{chefId}`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body:** None (GET request)

## Testing Different Scenarios

### Scenario 1: Pending Team Member
- **Condition:** Team member with status 'pending'
- **Expected:** 200 status with pending status

### Scenario 2: Active Team Member
- **Condition:** Team member with status 'active'
- **Expected:** 200 status with active status

### Scenario 3: Rejected Team Member
- **Condition:** Team member with status 'rejected'
- **Expected:** 200 status with rejected status

### Scenario 4: Invalid ID
- **Condition:** Invalid MongoDB ObjectId format
- **Expected:** 404 status with "User not found" message

### Scenario 5: Non-existent ID
- **Condition:** Valid ObjectId but user doesn't exist
- **Expected:** 404 status with "User not found" message

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

1. **Team Members** with different statuses:
   - `pending` - for pending approval
   - `active` - for approved members
   - `rejected` - for denied members

## Sample Database Entries for Testing

```javascript
// Team Member (Pending)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  email: "john.doe.1703123456789@chef.local",
  name: "John Doe",
  role: "user",
  status: "pending",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Active)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d3"),
  email: "jane.smith.1703123456790@chef.local",
  name: "Jane Smith",
  role: "user",
  status: "active",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Rejected)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d4"),
  email: "bob.johnson.1703123456791@chef.local",
  name: "Bob Johnson",
  role: "user",
  status: "rejected",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}
```

## Quick Test Commands

```bash
# Test pending member
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d2 | jq

# Test active member
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d3 | jq

# Test rejected member
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d4 | jq

# Test invalid ID
curl -X GET http://localhost:5002/api/chefs/invalid-id | jq

# Test non-existent ID
curl -X GET http://localhost:5002/api/chefs/64f8a1b2c3d4e5f6a7b8c9d9 | jq
```

## Integration with Registration Workflow

This endpoint is typically used after team member registration:

```javascript
// Complete workflow example
async function completeRegistrationWorkflow(headChefId, firstName, lastName) {
  // Step 1: Register team member
  const registrationResponse = await fetch('/api/chefs/request-access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headChefId, firstName, lastName })
  });
  
  if (registrationResponse.ok) {
    const registrationData = await registrationResponse.json();
    const userId = registrationData.userId;
    
    console.log('✅ Registration successful, checking status...');
    
    // Step 2: Check status
    const statusResponse = await fetch(`/api/chefs/${userId}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Current status:', statusData.data.status);
      
      // Step 3: Monitor status (in real app, you might poll this)
      if (statusData.data.status === 'pending') {
        console.log('⏳ Waiting for head chef approval...');
      }
    }
  }
}

// Usage
completeRegistrationWorkflow('64f8a1b2c3d4e5f6a7b8c9d0', 'Alice', 'Johnson');
```

## Status Monitoring

For real-time status monitoring, you can poll this endpoint:

```javascript
// Poll status every 30 seconds
function monitorStatus(chefId, maxAttempts = 20) {
  let attempts = 0;
  
  const pollInterval = setInterval(async () => {
    attempts++;
    
    const status = await testTeamStatus(chefId);
    
    if (status && status.status !== 'pending') {
      console.log(`🎉 Status changed to: ${status.status}`);
      clearInterval(pollInterval);
    } else if (attempts >= maxAttempts) {
      console.log('⏰ Max polling attempts reached');
      clearInterval(pollInterval);
    }
  }, 30000); // 30 seconds
}

// Usage
monitorStatus('64f8a1b2c3d4e5f6a7b8c9d2');
```
