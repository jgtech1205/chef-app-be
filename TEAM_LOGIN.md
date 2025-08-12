# Team Member Login Implementation

## Overview

The team member login endpoint allows team members to authenticate into the Chef en Place system using their head chef ID and their own chef ID. This provides a secure way for team members to access the system without traditional email/password authentication.

## Endpoint

```
POST /api/auth/login/{headChefId}/{chefId}
Content-Type: application/json
```

## Parameters

- `headChefId` (path parameter): The head chef's user ID
- `chefId` (path parameter): The team member's user ID

## Request Body

No request body is required for this endpoint.

## Response Scenarios

### 1. Approved Team Member

**When:** Team member status is 'active'

**Response:**
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

**HTTP Status:** 200 OK

### 2. Pending Approval

**When:** Team member status is 'pending'

**Response:**
```json
{
  "message": "Access pending approval",
  "status": "pending",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "email": "team@restaurant.com",
    "name": "Team Member Name",
    "role": "user",
    "status": "pending"
  }
}
```

**HTTP Status:** 401 Unauthorized

### 3. Access Denied

**When:** Team member status is 'rejected'

**Response:**
```json
{
  "message": "Access denied",
  "status": "rejected",
  "user": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "email": "team@restaurant.com",
    "name": "Team Member Name",
    "role": "user",
    "status": "rejected"
  }
}
```

**HTTP Status:** 401 Unauthorized

## Error Responses

### User Not Found
```json
{
  "message": "User not found"
}
```
**HTTP Status:** 404 Not Found

### User Account Not Active
```json
{
  "message": "User account is not active",
  "status": "inactive"
}
```
**HTTP Status:** 401 Unauthorized

### Server Error
```json
{
  "message": "Server error"
}
```
**HTTP Status:** 500 Internal Server Error

## Authentication Flow

1. **ID Validation**: System validates both headChefId and chefId exist
2. **Relationship Check**: Verifies the chef belongs to the specified head chef
3. **Status Check**: Checks the team member's status:
   - `active` → Generate tokens and allow access
   - `pending` → Return pending approval message
   - `rejected` → Return access denied message
   - Other → Return account not active message
4. **Token Generation**: For approved users, generate JWT access and refresh tokens
5. **Login Tracking**: Update last login timestamp
6. **Response**: Return user data and tokens

## Security Considerations

- Both headChefId and chefId must be valid MongoDB ObjectIds
- The chef must be linked to the specified head chef
- Only active users can authenticate
- All login attempts are logged
- Last login timestamps are tracked for audit purposes

## Testing

Use the provided test script to test the endpoint:

```bash
# Set environment variables
export API_URL=http://localhost:5002
export TEST_HEAD_CHEF_ID=your-head-chef-id
export TEST_CHEF_ID=your-chef-id

# Run the test
node scripts/test-team-login.js
```

## Integration Example

```javascript
// Frontend integration example
async function loginTeamMember(headChefId, chefId) {
  try {
    const response = await fetch(`/api/auth/login/${headChefId}/${chefId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user info
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      if (response.status === 401) {
        if (data.status === 'pending') {
          alert('Your access is pending approval. Please contact your head chef.');
        } else if (data.status === 'rejected') {
          alert('Your access has been denied. Please contact your head chef.');
        } else {
          alert('Your account is not active. Please contact your head chef.');
        }
      } else {
        alert(data.message);
      }
    }
  } catch (error) {
    console.error('Team member login failed:', error);
    alert('Login failed. Please try again.');
  }
}

// Usage
loginTeamMember('head-chef-id', 'chef-id');
```

## Database Requirements

To test the endpoint, you need:

1. **Head Chef** user with role 'head-chef' and status 'active'
2. **Team Member** user with role 'user' and linked to the head chef
3. **Different statuses** for testing:
   - `active` - for successful login
   - `pending` - for pending approval
   - `rejected` - for denied access

## Sample Database Entries

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

// Team Member (Active)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  email: "team@restaurant.com",
  name: "Team Member Name",
  role: "user",
  status: "active",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Pending)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d3"),
  email: "pending@restaurant.com",
  name: "Pending Member",
  role: "user",
  status: "pending",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0")
}

// Team Member (Rejected)
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

## Use Cases

1. **QR Code Integration**: QR codes can contain both headChefId and chefId for direct login
2. **Invitation Links**: Email invitations can include both IDs for seamless onboarding
3. **Mobile App Deep Links**: Mobile apps can use this endpoint for quick authentication
4. **Kiosk Mode**: Restaurant kiosks can use this for team member access

## Comparison with QR Authentication

| Feature | Team Login | QR Authentication |
|---------|------------|-------------------|
| **Authentication Method** | ID-based | Organization ID |
| **User Selection** | Specific user | Auto-selected |
| **Use Case** | Known team members | Unknown users |
| **Response Format** | `{ user, accessToken, refreshToken }` | `{ user, accessToken, refreshToken, restaurant? }` |
| **Status Handling** | Detailed status responses | Simplified status responses |
