# Team Member Login Validation

## Overview

The team member login endpoint validates the relationship between a team member and their head chef using organization ID and team member ID. This ensures proper access control and relationship verification.

## Endpoint

```
POST /api/auth/login/{headChefId}/{chefId}
```

## Parameters

- `headChefId` (path parameter): **Organization ID** (same as head chef's organization field)
- `chefId` (path parameter): Team member's user ID

## Validation Process

### Step 1: Head Chef Verification
```javascript
// Find head chef by organization ID
const headChef = await User.findOne({ 
  organization: headChefId,
  role: 'head-chef',
  isActive: true 
})
```

### Step 2: Team Member Relationship Validation
```javascript
// Find team member and verify relationship
const user = await User.findOne({ 
  _id: chefId, 
  headChef: headChef._id,        // Must belong to this head chef
  organization: headChefId,      // Must be in same organization
  isActive: true 
})
```

## Database Relationships

```javascript
// Head Chef
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"),
  organization: "my-restaurant-123",
  role: "head-chef",
  isActive: true
}

// Team Member
{
  _id: ObjectId("64f8a1b2c3d4e5f6a7b8c9d2"),
  organization: "my-restaurant-123",           // Same as head chef
  headChef: ObjectId("64f8a1b2c3d4e5f6a7b8c9d0"), // References head chef
  role: "user",
  isActive: true
}
```

## Validation Scenarios

### ✅ Valid Login
```bash
POST /api/auth/login/my-restaurant-123/64f8a1b2c3d4e5f6a7b8c9d2
```
- Organization exists
- Head chef found
- Team member belongs to head chef
- Team member is active

### ❌ Invalid Organization
```bash
POST /api/auth/login/invalid-org-id/64f8a1b2c3d4e5f6a7b8c9d2
```
**Response:** `404 - "Head chef not found"`

### ❌ Invalid Team Member
```bash
POST /api/auth/login/my-restaurant-123/invalid-chef-id
```
**Response:** `404 - "User not found or not associated with this head chef"`

### ❌ Mismatched Organization
```bash
POST /api/auth/login/different-org-id/64f8a1b2c3d4e5f6a7b8c9d2
```
**Response:** `404 - "User not found or not associated with this head chef"`

### ❌ Pending Team Member
```bash
POST /api/auth/login/my-restaurant-123/64f8a1b2c3d4e5f6a7b8c9d3
```
**Response:** `401 - "Access pending approval"`

### ❌ Rejected Team Member
```bash
POST /api/auth/login/my-restaurant-123/64f8a1b2c3d4e5f6a7b8c9d4
```
**Response:** `401 - "Access denied"`

## Security Features

1. **Organization Validation**: Verifies the organization exists and has an active head chef
2. **Relationship Validation**: Ensures team member belongs to the specified head chef
3. **Status Validation**: Checks team member's approval status
4. **Active Status Check**: Verifies both head chef and team member are active

## Testing

Use the provided test script to verify all scenarios:

```bash
# Set environment variables
export API_URL=http://localhost:5002
export TEST_ORG_ID=your-organization-id
export TEST_CHEF_ID=your-team-member-id

# Run the test
node scripts/test-team-login-validation.js
```

## Integration Example

```javascript
// Frontend integration example
async function loginTeamMember(organizationId, chefId) {
  try {
    const response = await fetch(`/api/auth/login/${organizationId}/${chefId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Team member login successful:', data);
      return data;
    } else {
      console.log('❌ Team member login failed:', data);
      
      if (response.status === 404) {
        if (data.message.includes('Head chef not found')) {
          alert('Invalid organization ID');
        } else {
          alert('Team member not found or not associated with this organization');
        }
      } else if (response.status === 401) {
        if (data.status === 'pending') {
          alert('Your access is pending approval');
        } else if (data.status === 'rejected') {
          alert('Your access has been denied');
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
    return null;
  }
}

// Usage
loginTeamMember('my-restaurant-123', '64f8a1b2c3d4e5f6a7b8c9d2');
```

## Database Requirements

To test the endpoint, you need:

1. **Head Chef** with:
   - `organization: "my-restaurant-123"`
   - `role: "head-chef"`
   - `isActive: true`

2. **Team Members** with:
   - `organization: "my-restaurant-123"` (same as head chef)
   - `headChef: ObjectId("head-chef-id")` (references head chef)
   - `role: "user"`
   - Different statuses for testing

## Error Handling

| Error | Status | Message | Cause |
|-------|--------|---------|-------|
| Invalid Organization | 404 | "Head chef not found" | Organization doesn't exist |
| Invalid Team Member | 404 | "User not found or not associated with this head chef" | Team member doesn't exist or wrong organization |
| Pending Approval | 401 | "Access pending approval" | Team member status is 'pending' |
| Access Denied | 401 | "Access denied" | Team member status is 'rejected' |
| Inactive Account | 401 | "User account is not active" | Team member status is not 'active' |

## Relationship Diagram

```
Organization: "my-restaurant-123"
├── Head Chef (ID: 64f8a1b2c3d4e5f6a7b8c9d0)
│   ├── organization: "my-restaurant-123"
│   └── role: "head-chef"
└── Team Members
    ├── Member 1 (ID: 64f8a1b2c3d4e5f6a7b8c9d2)
    │   ├── organization: "my-restaurant-123"
    │   ├── headChef: 64f8a1b2c3d4e5f6a7b8c9d0
    │   └── status: "active"
    ├── Member 2 (ID: 64f8a1b2c3d4e5f6a7b8c9d3)
    │   ├── organization: "my-restaurant-123"
    │   ├── headChef: 64f8a1b2c3d4e5f6a7b8c9d0
    │   └── status: "pending"
    └── Member 3 (ID: 64f8a1b2c3d4e5f6a7b8c9d4)
        ├── organization: "my-restaurant-123"
        ├── headChef: 64f8a1b2c3d4e5f6a7b8c9d0
        └── status: "rejected"
```
