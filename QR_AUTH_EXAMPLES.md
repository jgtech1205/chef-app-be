# QR Authentication - Testing Examples

## Using curl

### Test QR Authentication with Organization ID

```bash
# Replace 'your-org-id' with an actual organization ID from your database
curl -X POST http://localhost:5002/api/auth/qr/your-org-id \
  -H "Content-Type: application/json"
```

### Expected Success Response (Head Chef)

```json
{
  "message": "QR authentication successful - Head chef",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "headchef@restaurant.com",
    "name": "Head Chef Name",
    "role": "head-chef",
    "status": "active",
    "permissions": {
      "canViewRecipes": true,
      "canEditRecipes": true,
      "canDeleteRecipes": true,
      "canUpdateRecipes": true,
      "canViewPlateups": true,
      "canCreatePlateups": true,
      "canDeletePlateups": true,
      "canUpdatePlateups": true,
      "canViewNotifications": true,
      "canCreateNotifications": true,
      "canDeleteNotifications": true,
      "canUpdateNotifications": true,
      "canViewPanels": true,
      "canCreatePanels": true,
      "canDeletePanels": true,
      "canUpdatePanels": true,
      "canManageTeam": true,
      "canAccessAdmin": true
    },
    "qrAccess": true
  },
  "restaurant": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d1",
    "name": "Restaurant Name",
    "organizationId": "your-org-id"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Expected Success Response (Approved Team Member)

```json
{
  "message": "QR authentication successful - Approved team member",
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
    "qrAccess": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test with Invalid Organization ID

```bash
curl -X POST http://localhost:5002/api/auth/qr/invalid-org-id \
  -H "Content-Type: application/json"
```

**Expected Response (404):**
```json
{
  "message": "Restaurant not found or inactive"
}
```

### Test with Suspended Restaurant

```bash
curl -X POST http://localhost:5002/api/auth/qr/suspended-restaurant \
  -H "Content-Type: application/json"
```

**Expected Response (403):**
```json
{
  "message": "Restaurant access is currently suspended"
}
```

## Using JavaScript/Fetch

```javascript
// Test QR authentication
async function testQRAuth(orgId) {
  try {
    const response = await fetch(`http://localhost:5002/api/auth/qr/${orgId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ QR Authentication Successful:', data);
      
      // Store tokens for future use
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } else {
      console.log('❌ QR Authentication Failed:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Usage
testQRAuth('your-org-id');
```

## Using Postman

1. **Method:** POST
2. **URL:** `http://localhost:5002/api/auth/qr/{orgId}`
3. **Headers:** 
   - `Content-Type: application/json`
4. **Body:** Empty (no body required)

## Testing Different Scenarios

### Scenario 1: Head Chef Access
- **Condition:** No approved team members exist
- **Expected:** Head chef authentication with full permissions

### Scenario 2: Team Member Access
- **Condition:** Approved team members exist
- **Expected:** First approved team member authentication with limited permissions

### Scenario 3: Pending Approval
- **Condition:** Only pending team members exist
- **Expected:** 401 status with pending message

### Scenario 4: Access Denied
- **Condition:** Only rejected team members exist
- **Expected:** 401 status with rejected message

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

1. **Restaurant** with valid `organizationId`
2. **Head Chef** user linked to the restaurant
3. **Team Members** (optional) with different statuses:
   - `active` - for approved access
   - `pending` - for pending approval
   - `rejected` - for denied access

## Sample Database Entries

```javascript
// Restaurant
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d1"),
  name: "Test Restaurant",
  organizationId: "test-restaurant-123",
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  status: "active",
  isActive: true
}

// Head Chef
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  email: "headchef@restaurant.com",
  name: "Head Chef Name",
  role: "head-chef",
  status: "active",
  isActive: true,
  restaurant: ObjectId("64f8a1b2c3d4e5f6a7b8c9d1")
}

// Team Member (Active)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  email: "team@restaurant.com",
  name: "Team Member Name",
  role: "user",
  status: "active",
  isActive: true,
  restaurant: ObjectId("64f8a1b2c3d4e5f6a7b8c9d1")
}
```
