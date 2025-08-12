# QR Authentication Implementation

## Overview

The QR authentication endpoint allows users to authenticate into the Chef en Place system using a QR code that contains a restaurant's organization ID. This provides a seamless way for team members to access the system without traditional login credentials.

## Endpoint

```
POST /api/auth/qr/{orgId}
Content-Type: application/json
```

## Parameters

- `orgId` (path parameter): The restaurant's organization ID

## Request Body

No request body is required for this endpoint.

## Response Scenarios

### 1. Head Chef Authentication

**When:** No approved team members exist for the restaurant

**Response:**
```json
{
  "message": "QR authentication successful - Head chef",
  "user": {
    "id": "user_id",
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
    "id": "restaurant_id",
    "name": "Restaurant Name",
    "organizationId": "org_id"
  },
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 2. Approved Team Member Authentication

**When:** Approved team members exist for the restaurant

**Response:**
```json
{
  "message": "QR authentication successful - Approved team member",
  "user": {
    "id": "user_id",
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
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token"
}
```

### 3. Pending Approval

**When:** Team members exist but are pending approval

**Response:**
```json
{
  "message": "Access pending approval",
  "status": "pending",
  "pendingCount": 2
}
```

**HTTP Status:** 401 Unauthorized

### 4. Access Denied

**When:** Team members exist but are rejected

**Response:**
```json
{
  "message": "Access denied",
  "status": "rejected",
  "rejectedCount": 1
}
```

**HTTP Status:** 401 Unauthorized

## Error Responses

### Restaurant Not Found
```json
{
  "message": "Restaurant not found or inactive"
}
```
**HTTP Status:** 404 Not Found

### Restaurant Suspended
```json
{
  "message": "Restaurant access is currently suspended"
}
```
**HTTP Status:** 403 Forbidden

### Head Chef Not Found
```json
{
  "message": "Head chef not found or inactive"
}
```
**HTTP Status:** 404 Not Found

### Server Error
```json
{
  "message": "Server error during QR authentication"
}
```
**HTTP Status:** 500 Internal Server Error

## Authentication Flow

1. **QR Code Scan**: User scans QR code containing restaurant organization ID
2. **Restaurant Validation**: System validates restaurant exists and is active
3. **User Selection**: System selects appropriate user based on availability:
   - If approved team members exist → Use first approved team member
   - If no approved team members → Use head chef
   - If pending members exist → Return pending status
   - If rejected members exist → Return rejected status
4. **Token Generation**: Generate JWT access and refresh tokens
5. **QR Access Tracking**: Update user's QR access timestamp
6. **Response**: Return user data and tokens

## Security Considerations

- QR codes should be generated securely and contain only the organization ID
- QR codes should have expiration times for security
- Access is limited to active restaurants and users
- All authentication attempts are logged
- QR access timestamps are tracked for audit purposes

## Testing

Use the provided test script to test the endpoint:

```bash
# Set environment variables
export API_URL=http://localhost:5002
export TEST_ORG_ID=your-test-org-id

# Run the test
node scripts/test-qr-auth.js
```

## Integration Example

```javascript
// Frontend integration example
async function authenticateWithQR(orgId) {
  try {
    const response = await fetch(`/api/auth/qr/${orgId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      const error = await response.json();
      
      if (response.status === 401) {
        if (error.status === 'pending') {
          alert('Your access is pending approval. Please contact your head chef.');
        } else if (error.status === 'rejected') {
          alert('Your access has been denied. Please contact your head chef.');
        }
      } else {
        alert(error.message);
      }
    }
  } catch (error) {
    console.error('QR authentication failed:', error);
    alert('Authentication failed. Please try again.');
  }
}
```

## Database Schema Updates

The User model includes QR access tracking fields:

```javascript
// QR Access fields
qrAccess: {
  type: Boolean,
  default: false,
},
qrAccessDate: {
  type: Date,
  default: null,
},
```

These fields are automatically updated when QR authentication is used.
