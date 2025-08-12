# 🔄 Team Member Reactivation Links (After 1-Year Token Expiry)

## Overview
When team member tokens expire after 1 year, they need a way to reactivate their login without credentials. These endpoints provide the exact links team members will use.

## Endpoints

### 1. Get All Reactivation Links
**Endpoint:** `GET /api/users/reactivation-links`

**Description:** Returns reactivation links for all team members organized by organization.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTeamMembers": 5,
    "activeTeamMembers": 4,
    "reactivationLinks": [
      {
        "teamMemberId": "507f1f77bcf86cd799439011",
        "name": "James Bonds",
        "email": "james.bonds.1234567890@chef.local",
        "status": "active",
        "organizationId": "restaurant123",
        "organizationName": "Chef's Kitchen",
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "reactivationLink": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
        "reactivationInstructions": {
          "title": "Team Member Reactivation Link",
          "description": "Use this link to reactivate login after 1-year token expires",
          "method": "POST",
          "url": "/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
          "fullUrl": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
          "note": "No credentials needed - just POST to this URL to get new tokens"
        }
      }
    ],
    "organizationGroups": [
      {
        "organizationId": "restaurant123",
        "organizationName": "Chef's Kitchen",
        "teamMembers": [
          {
            "teamMemberId": "507f1f77bcf86cd799439011",
            "name": "James Bonds",
            "reactivationLink": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011"
          }
        ]
      }
    ],
    "instructions": {
      "title": "Team Member Reactivation After 1 Year",
      "description": "When team member tokens expire after 1 year, they can use these links to reactivate their login",
      "usage": "Team members can POST to their reactivation link to get new tokens without needing credentials",
      "note": "These links work for active team members only"
    }
  }
}
```

### 2. Get Specific Team Member Reactivation Link
**Endpoint:** `GET /api/users/reactivation-links/{memberId}`

**Description:** Returns reactivation link for a specific team member.

**Response:**
```json
{
  "success": true,
  "data": {
    "teamMemberId": "507f1f77bcf86cd799439011",
    "name": "James Bonds",
    "email": "james.bonds.1234567890@chef.local",
    "status": "active",
    "organizationId": "restaurant123",
    "organizationName": "Chef's Kitchen",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "reactivationLink": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
    "reactivationEndpoint": "/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
    "instructions": {
      "title": "Team Member Reactivation Link",
      "description": "Use this link to reactivate login after 1-year token expires",
      "method": "POST",
      "url": "/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
      "fullUrl": "https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011",
      "note": "No credentials needed - just POST to this URL to get new tokens",
      "curlExample": "curl -X POST https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011 -H \"Content-Type: application/json\""
    }
  }
}
```

## Frontend Implementation

### Get All Reactivation Links
```javascript
const getAllReactivationLinks = async () => {
  const response = await fetch('/api/users/reactivation-links', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Display all reactivation links
    result.data.reactivationLinks.forEach(link => {
      console.log(`${link.name}: ${link.reactivationLink}`);
    });
    
    // Group by organization
    result.data.organizationGroups.forEach(org => {
      console.log(`\n${org.organizationName}:`);
      org.teamMembers.forEach(member => {
        console.log(`  ${member.name}: ${member.reactivationLink}`);
      });
    });
  }
};
```

### Get Specific Team Member Reactivation Link
```javascript
const getTeamMemberReactivationLink = async (memberId) => {
  const response = await fetch(`/api/users/reactivation-links/${memberId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    const data = result.data;
    
    console.log(`Team Member: ${data.name}`);
    console.log(`Reactivation Link: ${data.reactivationLink}`);
    console.log(`Instructions: ${data.instructions.note}`);
    console.log(`cURL Example: ${data.instructions.curlExample}`);
  }
};
```

## Usage Examples

### 1. Display Reactivation Links in Team Folder
```javascript
// Get all reactivation links
const reactivationData = await getAllReactivationLinks();

// Display in team member folder
reactivationData.data.organizationGroups.forEach(org => {
  console.log(`\n📁 ${org.organizationName}`);
  org.teamMembers.forEach(member => {
    console.log(`  👤 ${member.name}`);
    console.log(`  🔗 Reactivation: ${member.reactivationLink}`);
  });
});
```

### 2. Share Reactivation Link with Team Member
```javascript
// Get specific team member's reactivation link
const memberData = await getTeamMemberReactivationLink('507f1f77bcf86cd799439011');

const reactivationInfo = {
  name: memberData.data.name,
  link: memberData.data.reactivationLink,
  instructions: memberData.data.instructions.note,
  curlExample: memberData.data.instructions.curlExample
};

// Share with team member
console.log(`Hi ${reactivationInfo.name}, here's your reactivation link:`);
console.log(`Link: ${reactivationInfo.link}`);
console.log(`Instructions: ${reactivationInfo.instructions}`);
```

### 3. Generate Reactivation Instructions
```javascript
// Get all reactivation links
const reactivationData = await getAllReactivationLinks();

// Generate instructions for all team members
reactivationData.data.reactivationLinks.forEach(link => {
  console.log(`\n📋 ${link.name} - ${link.organizationName}`);
  console.log(`🔗 Reactivation Link: ${link.reactivationLink}`);
  console.log(`📝 Instructions: ${link.reactivationInstructions.note}`);
});
```

## Testing

### Test All Reactivation Links
```bash
curl -X GET https://your-api.com/api/users/reactivation-links \
  -H "Authorization: Bearer your_token"
```

### Test Specific Team Member Reactivation Link
```bash
curl -X GET https://your-api.com/api/users/reactivation-links/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer your_token"
```

### Test Reactivation (Team Member Usage)
```bash
# Use the reactivation link returned from the API
curl -X POST https://chef-app-frontend.vercel.app/api/auth/login/restaurant123/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json"
```

## Team Member Usage

### When Tokens Expire (After 1 Year)
1. **Team member's tokens expire** (after 1 year)
2. **Head chef provides reactivation link** from this endpoint
3. **Team member POSTs to reactivation link** (no credentials needed)
4. **Team member gets new tokens** and continues using the app

### Example Reactivation Request
```javascript
// Team member reactivation (no credentials needed)
const reactivateLogin = async (reactivationLink) => {
  const response = await fetch(reactivationLink, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  
  if (result.accessToken) {
    // Store new tokens
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Continue using the app
    console.log('Login reactivated successfully!');
  }
};
```

## Security Features

- **Authentication required** - Only head chefs can access reactivation links
- **Active status only** - Only active team members can reactivate
- **Organization validation** - Links only work for team members in the head chef's organization
- **No credentials needed** - Team members don't need to remember passwords

## Integration with Existing Features

- **1-Year Token Expiry** - Works with the 1-year token expiration setting
- **Team Member Login** - Uses the same endpoint as team member login
- **Auto-login** - Complements the auto-login after approval feature
- **QR Code Access** - Alternative to QR code for team member access

## Use Cases

1. **Token Expiry Management** - Head chefs can provide reactivation links when tokens expire
2. **Team Member Support** - Easy way to help team members get back into the system
3. **Documentation** - Clear instructions for team member reactivation
4. **Bulk Management** - Get all reactivation links for multiple team members
