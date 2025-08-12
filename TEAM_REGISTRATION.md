# Team Member Registration Implementation

## Overview

The team member registration endpoint allows individuals to request access to join a head chef's team. This creates a new user account with pending status that the head chef can later approve or reject.

## Endpoint

```
POST /api/chefs/request-access
Content-Type: application/json
```

## Request Body

```json
{
  "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Parameters

- `headChefId` (required): The head chef's user ID (MongoDB ObjectId)
- `firstName` (required): Team member's first name (minimum 1 character)
- `lastName` (required): Team member's last name (minimum 1 character)

## Response

### Success Response (201 Created)

```json
{
  "id": "64f8a1b2c3d4e5f6a7b8c9d2",
  "status": "pending",
  "userId": "64f8a1b2c3d4e5f6a7b8c9d2"
}
```

### Error Responses

#### Validation Error (400 Bad Request)
```json
{
  "errors": [
    {
      "type": "field",
      "value": "invalid-id",
      "msg": "Invalid value",
      "path": "headChefId",
      "location": "body"
    }
  ]
}
```

#### Head Chef Not Found (404 Not Found)
```json
{
  "message": "Head chef not found"
}
```

#### Duplicate Request (400 Bad Request)
```json
{
  "message": "You have already requested access"
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "message": "Server error"
}
```

## Registration Flow

1. **Validation**: System validates all required fields and formats
2. **Head Chef Verification**: Verifies the head chef exists and has the correct role
3. **Duplicate Check**: Checks if a request already exists for the same name and head chef
4. **User Creation**: Creates a new user account with:
   - Auto-generated email: `{firstName}.{lastName}.{timestamp}@chef.local`
   - Auto-generated password: Random 8-character string
   - Status: `pending`
   - Role: `user`
   - Basic view permissions enabled
5. **Response**: Returns the request details

## User Account Details

When a team member registers, the system automatically creates a user account with:

### Generated Credentials
- **Email**: `{firstName}.{lastName}.{timestamp}@chef.local`
- **Password**: Random 8-character string (hashed with bcrypt)

### Account Settings
- **Role**: `user`
- **Status**: `pending`
- **isActive**: `true`
- **headChef**: Links to the specified head chef
- **organization**: Inherited from head chef

### Default Permissions
```json
{
  "canViewRecipes": true,
  "canViewPlateups": true,
  "canViewNotifications": true,
  "canViewPanels": true,
  "canEditRecipes": false,
  "canDeleteRecipes": false,
  "canUpdateRecipes": false,
  "canCreatePlateups": false,
  "canDeletePlateups": false,
  "canUpdatePlateups": false,
  "canCreateNotifications": false,
  "canDeleteNotifications": false,
  "canUpdateNotifications": false,
  "canCreatePanels": false,
  "canDeletePanels": false,
  "canUpdatePanels": false,
  "canManageTeam": false,
  "canAccessAdmin": false
}
```

## Testing

Use the provided test script to test the endpoint:

```bash
# Set environment variables
export API_URL=http://localhost:5002
export TEST_HEAD_CHEF_ID=your-head-chef-id

# Run the test
node scripts/test-team-registration.js
```

## Integration Example

```javascript
// Frontend integration example
async function requestTeamAccess(headChefId, firstName, lastName) {
  try {
    const response = await fetch('/api/chefs/request-access', {
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
      console.log('✅ Access request submitted successfully:', data);
      
      // Store request details for tracking
      localStorage.setItem('requestId', data.id);
      localStorage.setItem('requestStatus', data.status);
      
      return data;
    } else {
      console.log('❌ Access request failed:', data);
      
      if (response.status === 400) {
        if (data.message === 'You have already requested access') {
          alert('You have already submitted a request for this head chef.');
        } else {
          alert('Please check your input and try again.');
        }
      } else if (response.status === 404) {
        alert('Head chef not found. Please check the head chef ID.');
      } else {
        alert('Request failed. Please try again later.');
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    alert('Network error. Please check your connection and try again.');
    return null;
  }
}

// Usage
requestTeamAccess('64f8a1b2c3d4e5f6a7b8c9d0', 'John', 'Doe');
```

## Database Requirements

To test the endpoint, you need:

1. **Head Chef** user with role 'head-chef' and status 'active'
2. **Organization** field set on the head chef user

## Sample Database Entry

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

// Generated Team Member (after registration)
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  email: "john.doe.1703123456789@chef.local",
  password: "$2a$12$hashedPassword...",
  name: "John Doe",
  role: "user",
  status: "pending",
  isActive: true,
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  organization: "restaurant-org-123",
  permissions: {
    canViewRecipes: true,
    canViewPlateups: true,
    canViewNotifications: true,
    canViewPanels: true,
    // ... other permissions set to false
  }
}
```

## Security Considerations

- Head chef ID must be a valid MongoDB ObjectId
- Duplicate requests are prevented for the same name and head chef
- Passwords are automatically generated and hashed
- Email addresses are auto-generated to prevent conflicts
- All requests start with 'pending' status requiring approval

## Workflow Integration

1. **Registration**: Team member submits access request
2. **Notification**: Head chef receives notification of pending request
3. **Review**: Head chef reviews and approves/rejects the request
4. **Activation**: Approved team members can then use the login endpoints

## Related Endpoints

- `POST /api/auth/login/{headChefId}/{chefId}` - Team member login
- `GET /api/chefs/pending` - List pending requests (head chef only)
- `PUT /api/chefs/{id}/status` - Approve/reject requests (head chef only)
