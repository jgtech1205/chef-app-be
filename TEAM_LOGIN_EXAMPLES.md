# Team Member Login - Testing Examples

## Using curl

### Test Team Member Login with Valid IDs

```bash
# Replace with actual IDs from your database
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json"
```

### Expected Success Response (Approved Team Member)

```json
{
  "message": "Login successful",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "email": "team@restaurant.com",
    "name": "Team Member Name",
    "role": "user",
    "status": "active",
    "permissions": {
      "canViewRecipes": true,
      "canEditRecipes": false,
      "canDeleteRecipes": false,
      "canUpdateRecipes": false,
      "canViewPlateups": true,
      "canCreatePlateups": false,
      "canDeletePlateups": false,
      "canUpdatePlateups": false,
      "canViewNotifications": true,
      "canCreateNotifications": false,
      "canDeleteNotifications": false,
      "canUpdateNotifications": false,
      "canViewPanels": true,
      "canCreatePanels": false,
      "canDeletePanels": false,
      "canUpdatePanels": false,
      "canManageTeam": false,
      "canAccessAdmin": false
    },
    "avatar": "https://example.com/avatar.jpg"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test with Pending Team Member

```bash
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d3 \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "message": "Access pending approval",
  "status": "pending",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d3",
    "email": "pending@restaurant.com",
    "name": "Pending Member",
    "role": "user",
    "status": "pending"
  }
}
```

### Test with Rejected Team Member

```bash
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d4 \
  -H "Content-Type: application/json"
```

**Expected Response (401):**
```json
{
  "message": "Access denied",
  "status": "rejected",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d4",
    "email": "rejected@restaurant.com",
    "name": "Rejected Member",
    "role": "user",
    "status": "rejected"
  }
}
```

### Test with Invalid Chef ID

```bash
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/invalid-chef-id \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "User not found"
}
```

### Test with Invalid Head Chef ID

```bash
curl -X POST http://localhost:5002/api/auth/login/invalid-head-chef-id/64f8a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "User not found"
}
```

### Test with Mismatched IDs

```bash
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d2/64f8a1b2c3d4e5f6a7b8c9d0 \
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
// Test team member login
async function testTeamLogin(headChefId, chefId) {
  try {
    const response = await fetch(`http://localhost:5002/api/auth/login/${headChefId}/${chefId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Team Login Successful:', data);
      
      // Store tokens for future use
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } else {
      console.log('❌ Team Login Failed:', data);
      
      if (response.status === 401) {
        if (data.status === 'pending') {
          console.log('⏳ Access pending approval');
        } else if (data.status === 'rejected') {
          console.log('❌ Access denied');
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Usage examples
testTeamLogin('64f8a1b2c3d4e5f6a7b8c9d0', '64f8a1b2c3d4e5f6a7b8c9d2'); // Active member
testTeamLogin('64f8a1b2c3d4e5f6a7b8c9d0', '64f8a1b2c3d4e5f6a7b8c9d3'); // Pending member
testTeamLogin('64f8a1b2c3d4e5f6a7b8c9d0', '64f8a1b2c3d4e5f6a7b8c9d4'); // Rejected member
```

## Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:5002/api/auth/login/{headChefId}/{chefId}`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body:** Empty (no body required)

## Testing Different Scenarios

### Scenario 1: Approved Team Member
- **Condition:** Team member status is 'active'
- **Expected:** 200 status with user data and tokens

### Scenario 2: Pending Team Member
- **Condition:** Team member status is 'pending'
- **Expected:** 401 status with pending message

### Scenario 3: Rejected Team Member
- **Condition:** Team member status is 'rejected'
- **Expected:** 401 status with rejected message

### Scenario 4: Invalid IDs
- **Condition:** Invalid headChefId or chefId
- **Expected:** 404 status with "User not found" message

### Scenario 5: Mismatched IDs
- **Condition:** Chef doesn't belong to specified head chef
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

1. **Head Chef** user with role 'head-chef' and status 'active'
2. **Team Members** with different statuses:
   - `active` - for successful login
   - `pending` - for pending approval
   - `rejected` - for denied access
3. **Proper linking** between head chef and team members

## Sample Database Entries for Testing

```javascript
// Head Chef
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  email: "headchef@restaurant.com",
  name: "Head Chef Name",
  role: "head-chef",
  status: "active",
  isActive: true
}

// Team Member (Active) - Should succeed
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  email: "team@restaurant.com",
  name: "Team Member Name",
  role: "user",
  status: "active",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Pending) - Should return 401 pending
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d3"),
  email: "pending@restaurant.com",
  name: "Pending Member",
  role: "user",
  status: "pending",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Rejected) - Should return 401 rejected
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d4"),
  email: "rejected@restaurant.com",
  name: "Rejected Member",
  role: "user",
  status: "rejected",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}
```

## Quick Test Commands

```bash
# Test successful login
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d2 \
  -H "Content-Type: application/json" | jq

# Test pending approval
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d3 \
  -H "Content-Type: application/json" | jq

# Test access denied
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/64f8a1b2c3d4e5f6a7b8c9d4 \
  -H "Content-Type: application/json" | jq

# Test invalid user
curl -X POST http://localhost:5002/api/auth/login/64f8a1b2c3d4e5f6a7b8c9d0/invalid-id \
  -H "Content-Type: application/json" | jq
```

## Integration with QR Codes

This endpoint can be used in combination with QR codes:

```javascript
// QR code could contain: "team-login:headChefId:chefId"
function handleQRCode(qrData) {
  const parts = qrData.split(':');
  if (parts[0] === 'team-login' && parts.length === 3) {
    const [, headChefId, chefId] = parts;
    loginTeamMember(headChefId, chefId);
  }
}
```
