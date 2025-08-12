# Team Member Status Implementation

## Overview

The team member status endpoint allows you to retrieve the current status and basic information of a team member by their user ID. This is useful for checking the approval status of team member requests.

## Endpoint

```
GET /api/chefs/{chefId}
```

## Parameters

- `chefId` (path parameter): The team member's user ID (MongoDB ObjectId)

## Response

### Success Response (200 OK)

```json
{
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d2",
    "status": "pending",
    "name": "John Doe"
  }
}
```

### Error Responses

#### User Not Found (404 Not Found)
```json
{
  "message": "User not found"
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "message": "Server error"
}
```

## Status Values

The `status` field can have the following values:

- **`pending`**: Team member has requested access but not yet approved
- **`active`**: Team member has been approved and can access the system
- **`rejected`**: Team member's access request has been denied

## Testing

Use the provided test script to test the endpoint:

```bash
# Set environment variables
export API_URL=http://localhost:5002
export TEST_CHEF_ID=your-chef-id

# Run the test
node scripts/test-team-status.js
```

## Integration Example

```javascript
// Frontend integration example
async function getTeamMemberStatus(chefId) {
  try {
    const response = await fetch(`/api/chefs/${chefId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Team member status retrieved:', data);
      
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
      console.log('❌ Failed to get team member status:', data);
      
      if (response.status === 404) {
        alert('Team member not found. Please check the ID.');
      } else {
        alert('Failed to get team member status. Please try again.');
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
getTeamMemberStatus('64f8a1b2c3d4e5f6a7b8c9d2');
```

## Use Cases

1. **Check Registration Status**: After registering, check if the request is pending, approved, or rejected
2. **Status Monitoring**: Periodically check the status of team member requests
3. **UI Updates**: Update the user interface based on the current status
4. **Workflow Integration**: Use status information to guide users through the approval process

## Database Requirements

To test the endpoint, you need:

1. **Team Member** user with role 'user' and any status (pending, active, rejected)

## Sample Database Entries

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

## Workflow Integration

This endpoint is typically used in the following workflow:

1. **Registration**: Team member registers using `/api/chefs/request-access`
2. **Status Check**: Use this endpoint to check the current status
3. **Approval Process**: Head chef approves/rejects the request
4. **Status Update**: Check status again to see the result
5. **Login**: Once approved, team member can use login endpoints

## Security Considerations

- No authentication required (public endpoint)
- Only returns basic information (id, status, name)
- Sensitive information like email and permissions are not exposed
- Validates that the user exists before returning data

## Related Endpoints

- `POST /api/chefs/request-access` - Register team member
- `POST /api/auth/login/{headChefId}/{chefId}` - Team member login
- `GET /api/chefs/pending` - List pending requests (head chef only)
- `PUT /api/chefs/{id}/status` - Approve/reject requests (head chef only)
