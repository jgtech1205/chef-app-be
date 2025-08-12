# 🔗 Organization Team Member Login Links

## Overview
New endpoints to display team member login links for each organization. Head chefs can now easily access and share login information for their team members.

## Endpoints

### 1. Get All Organizations with Login Links
**Endpoint:** `GET /api/users/organizations/login-links`

**Description:** Returns all organizations where the head chef is the owner, with their respective login links.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "restaurant123",
      "name": "Chef's Kitchen",
      "status": "active",
      "loginLink": "https://chef-app-frontend.vercel.app/restaurant/restaurant123",
      "qrCodeUrl": "https://chef-app-frontend.vercel.app/restaurant/restaurant123",
      "teamMemberLoginEndpoint": "/api/auth/login/restaurant123/{chefId}"
    },
    {
      "id": "cafe456",
      "name": "Downtown Cafe",
      "status": "active",
      "loginLink": "https://chef-app-frontend.vercel.app/restaurant/cafe456",
      "qrCodeUrl": "https://chef-app-frontend.vercel.app/restaurant/cafe456",
      "teamMemberLoginEndpoint": "/api/auth/login/cafe456/{chefId}"
    }
  ]
}
```

### 2. Get Specific Organization Login Link
**Endpoint:** `GET /api/users/organizations/{organizationId}/login-link`

**Description:** Returns detailed login information for a specific organization, including team member details.

**Response:**
```json
{
  "success": true,
  "data": {
    "organizationId": "restaurant123",
    "organizationName": "Chef's Kitchen",
    "loginLink": "https://chef-app-frontend.vercel.app/restaurant/restaurant123",
    "qrCodeUrl": "https://chef-app-frontend.vercel.app/restaurant/restaurant123",
    "teamMembers": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "James Bonds",
        "email": "james.bonds.1234567890@chef.local",
        "status": "active",
        "loginUrl": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011"
      },
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "email": "jane.smith.1234567890@chef.local",
        "status": "active",
        "loginUrl": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439012"
      }
    ],
    "instructions": {
      "qrCode": "Scan QR code or visit: https://chef-app-frontend.vercel.app/restaurant/restaurant123",
      "manualLogin": "Team members can login using: POST /api/auth/login/restaurant123/{chefId}",
      "chefIds": [
        "James Bonds: 507f1f77bcf86cd799439011",
        "Jane Smith: 507f1f77bcf86cd799439012"
      ]
    }
  }
}
```

## Frontend Implementation

### Get All Organizations
```javascript
const getAllOrganizations = async () => {
  const response = await fetch('/api/users/organizations/login-links', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    result.data.forEach(org => {
      console.log(`Organization: ${org.name}`);
      console.log(`QR Code URL: ${org.loginLink}`);
      console.log(`Team Member Login: ${org.teamMemberLoginEndpoint}`);
    });
  }
};
```

### Get Specific Organization
```javascript
const getOrganizationLoginLink = async (organizationId) => {
  const response = await fetch(`/api/users/organizations/${organizationId}/login-link`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    const data = result.data;
    
    // Display QR code URL
    console.log(`QR Code: ${data.loginLink}`);
    
    // Display team member IDs
    data.teamMembers.forEach(member => {
      console.log(`${member.name}: ${member.id}`);
    });
    
    // Display instructions
    console.log(data.instructions.qrCode);
    console.log(data.instructions.manualLogin);
  }
};
```

## Usage Examples

### 1. Display QR Code for Organization
```javascript
// Get organization login link
const orgData = await getOrganizationLoginLink('restaurant123');

// Display QR code
const qrCodeUrl = orgData.data.loginLink;
// Use this URL to generate QR code for team members
```

### 2. Share Team Member IDs
```javascript
// Get team member information
const orgData = await getOrganizationLoginLink('restaurant123');

// Display team member IDs for manual login
orgData.data.teamMembers.forEach(member => {
  console.log(`${member.name}: ${member.id}`);
  console.log(`Login URL: ${member.loginUrl}`);
});
```

### 3. Generate QR Code Instructions
```javascript
// Get instructions for team members
const orgData = await getOrganizationLoginLink('restaurant123');

const instructions = orgData.data.instructions;
console.log(instructions.qrCode);        // "Scan QR code or visit: ..."
console.log(instructions.manualLogin);   // "Team members can login using: ..."
console.log(instructions.chefIds);       // Array of "Name: ID" strings
```

## Testing

### Test All Organizations
```bash
curl -X GET https://your-api.com/api/users/organizations/login-links \
  -H "Authorization: Bearer your_token"
```

### Test Specific Organization
```bash
curl -X GET https://your-api.com/api/users/organizations/restaurant123/login-link \
  -H "Authorization: Bearer your_token"
```

## Security

- **Authentication required** - Only head chefs can access their organizations
- **Organization ownership** - Head chefs can only access their own organizations
- **Active status only** - Only active team members are included
- **Permission check** - Requires `canManageTeam` permission

## Use Cases

1. **QR Code Generation** - Use `loginLink` to generate QR codes for team members
2. **Manual Login Sharing** - Share `teamMemberLoginEndpoint` with team member IDs
3. **Team Management** - Display all team members with their login information
4. **Instructions Display** - Show clear instructions for team member login

## Integration with Existing Features

- **QR Authentication** - Uses the same organization ID as QR code authentication
- **Team Member Login** - Provides the exact endpoint and parameters needed
- **Auto-login** - Works with the existing auto-login after approval feature
- **Token Management** - Returns the same JWT tokens as other login methods
