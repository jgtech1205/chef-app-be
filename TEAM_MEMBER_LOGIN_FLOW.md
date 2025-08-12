# 🔐 Team Member Auto-Login After Approval

## Problem
Team members get approved but can't log in because they don't have email/password credentials.

## Solution: Auto-Login After Approval ✅

When a head chef approves a team member, the backend automatically returns login tokens, allowing the team member to be logged in immediately.

## How It Works

### Backend Response (when approving):
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": {
    "id": "user_id",
    "name": "James Bonds",
    "email": "james.bonds.1234567890@chef.local",
    "role": "user",
    "isActive": true,
    "status": "active"
  },
  "loginData": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": {
      "id": "user_id",
      "email": "james.bonds.1234567890@chef.local",
      "name": "James Bonds",
      "role": "user",
      "status": "active",
      "permissions": { ... }
    }
  }
}
```

### Frontend Implementation:
```javascript
// When head chef approves team member
const approveTeamMember = async (userId) => {
  const response = await fetch(`/api/users/team/${userId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${headChefToken}`
    },
    body: JSON.stringify({ status: 'active' })
  });
  
  const result = await response.json();
  
  if (result.loginData) {
    // Auto-login the team member
    localStorage.setItem('accessToken', result.loginData.accessToken);
    localStorage.setItem('refreshToken', result.loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(result.loginData.user));
    
    // Redirect to team member dashboard
    window.location.href = '/team-member-dashboard';
  }
};
```

## User Experience Flow

1. **Team member requests access** → Status: `pending`
2. **Head chef approves** → Status: `active` + Auto-login tokens
3. **Team member is immediately logged in** and redirected to dashboard
4. **Future logins** use regular email/password or team member login

## Testing

### Test Auto-Login After Approval
```bash
# 1. Create team member request
curl -X POST https://your-api.com/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "head_chef_id",
    "firstName": "James",
    "lastName": "Bonds"
  }'

# 2. Approve team member (as head chef)
curl -X PUT https://your-api.com/api/users/team/team_member_id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer head_chef_token" \
  -d '{"status": "active"}'

# Should return loginData with tokens
```

## Security Considerations

1. **Auto-generated emails** use `@chef.local` domain to identify team member accounts
2. **Passwords are hashed** before storage
3. **Tokens expire** and need refresh
4. **Head chef validation** ensures only authorized access
5. **Status checks** prevent unauthorized access

## Implementation Notes

- The `loginData` is only returned when a user's status changes from `pending` to `active`
- Team members can still use the existing team member login endpoint for future logins
- QR code access also works for approved team members
