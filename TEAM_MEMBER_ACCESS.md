# 🔓 Team Member Access - Active User Only

## Overview
Team members now have **permanent access** as long as their user account is active. No token expiration, no reactivation needed.

## How It Works

### **Access Control:**
- **Active User** = Full access to the system
- **Inactive User** = No access (head chef can deactivate)
- **No Token Expiration** = Team members stay logged in forever

### **User Status Management:**
- **Head chef controls access** by activating/deactivating team members
- **No automatic expiration** - access continues until manually revoked
- **Simple management** - just change user status to control access

## User Status Values

### **Active Status:**
```javascript
{
  "status": "active",
  "isActive": true
}
```
- ✅ **Full access** to the system
- ✅ **Can log in** using team member login endpoint
- ✅ **Can use QR codes** for restaurant access
- ✅ **Tokens never expire**

### **Inactive Status:**
```javascript
{
  "status": "inactive", // or any other status
  "isActive": false
}
```
- ❌ **No access** to the system
- ❌ **Cannot log in** even with valid tokens
- ❌ **Cannot use QR codes**

## Team Member Login Flow

### **1. Team Member Gets Approved:**
```javascript
// Head chef approves team member
PUT /api/users/team/{memberId}
{
  "status": "active",
  "isActive": true
}

// Response includes login tokens
{
  "success": true,
  "loginData": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ... }
  }
}
```

### **2. Team Member Stays Logged In:**
- **Tokens last 100 years** (effectively permanent)
- **No need to re-login** unless head chef deactivates account
- **Can use QR codes** anytime for quick access

### **3. Head Chef Controls Access:**
```javascript
// Deactivate team member (revokes access)
PUT /api/users/team/{memberId}
{
  "isActive": false
}

// Reactivate team member (restores access)
PUT /api/users/team/{memberId}
{
  "isActive": true
}
```

## Login Methods

### **1. Auto-Login After Approval:**
- Team member automatically logged in when approved
- Gets permanent tokens (100-year expiration)

### **2. Team Member Login Endpoint:**
```
POST /api/auth/login/{headChefId}/{chefId}
```
- Works anytime for active team members
- No credentials needed
- Returns new permanent tokens

### **3. QR Code Access:**
```
POST /api/auth/qr/{orgId}
```
- Works for active team members
- Quick access without login

## Security Features

### **Access Control:**
- **Head chef controls** who has access
- **Active status required** for any access
- **Immediate revocation** when deactivated

### **Validation:**
- **Organization validation** - team members only access their organization
- **Status checks** - only active users can log in
- **Permission system** - granular control over features

## Frontend Implementation

### **Team Member Dashboard:**
```javascript
// Check if team member is active
const checkAccess = async () => {
  const response = await fetch('/api/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const user = await response.json();
  
  if (!user.isActive) {
    // Show access denied message
    showAccessDenied();
  } else {
    // Show dashboard
    showDashboard();
  }
};
```

### **Head Chef Management:**
```javascript
// Deactivate team member
const deactivateTeamMember = async (memberId) => {
  const response = await fetch(`/api/users/team/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: false })
  });
  
  // Team member loses access immediately
  console.log('Team member deactivated');
};

// Reactivate team member
const reactivateTeamMember = async (memberId) => {
  const response = await fetch(`/api/users/team/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: true })
  });
  
  // Team member regains access
  console.log('Team member reactivated');
};
```

## Benefits

### **For Team Members:**
- ✅ **No login hassles** - stay logged in forever
- ✅ **No password management** - no credentials to remember
- ✅ **Quick access** - QR codes work anytime
- ✅ **Reliable access** - works as long as account is active

### **For Head Chefs:**
- ✅ **Simple management** - just activate/deactivate users
- ✅ **Immediate control** - revoke access instantly
- ✅ **No token management** - no expiration to worry about
- ✅ **Clear access control** - active = access, inactive = no access

### **For System:**
- ✅ **Simplified logic** - no complex token expiration
- ✅ **Better UX** - team members don't get logged out unexpectedly
- ✅ **Easier support** - no reactivation issues
- ✅ **Clear permissions** - based on user status only

## Migration from Token Expiration

### **Old System (Token Expiration):**
- Tokens expire after 1 year
- Team members need reactivation links
- Complex token management
- Support issues with expired tokens

### **New System (Active User Only):**
- Tokens last 100 years (effectively permanent)
- Access controlled by user status only
- Simple activate/deactivate management
- No reactivation needed

## Testing

### **Test Active Team Member:**
```bash
# Team member should have access
curl -X POST https://your-api.com/api/auth/login/orgId/chefId \
  -H "Content-Type: application/json"
```

### **Test Inactive Team Member:**
```bash
# Team member should be denied access
curl -X POST https://your-api.com/api/auth/login/orgId/chefId \
  -H "Content-Type: application/json"
# Should return 401 Unauthorized
```

## Summary

**Team members now have permanent access as long as their account is active.** Head chefs control access by simply activating or deactivating team member accounts. No more token expiration, no more reactivation links, no more login hassles! 🎉
