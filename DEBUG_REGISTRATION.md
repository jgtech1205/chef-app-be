# 🔍 Registration Issue Debugging Guide

## Problem
The registration form shows "Registration failed" when trying to register with "james" and "bonds" fields.

## Quick Debug Steps

### 1. Test API Connectivity
```bash
curl -X GET https://your-deployed-api.com/api/health
```

### 2. Test Regular Registration Endpoint
```bash
curl -X POST https://your-deployed-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3. Test Team Member Registration Endpoint
```bash
curl -X POST https://your-deployed-api.com/api/chefs/request-access \
  -H "Content-Type: application/json" \
  -d '{
    "headChefId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "firstName": "james",
    "lastName": "bonds"
  }'
```

### 4. Test What Frontend Might Be Sending
```bash
curl -X POST https://your-deployed-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "james",
    "lastName": "bonds"
  }'
```

## Expected Results

### ✅ Regular Registration Success
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  },
  "accessToken": "token",
  "refreshToken": "refresh_token"
}
```

### ✅ Team Registration Success
```json
{
  "id": "user_id",
  "status": "pending",
  "userId": "user_id"
}
```

### ❌ Expected Error (Missing Fields)
```json
{
  "errors": [
    {
      "param": "email",
      "msg": "Invalid value"
    },
    {
      "param": "password",
      "msg": "Invalid value"
    },
    {
      "param": "name",
      "msg": "Invalid value"
    }
  ]
}
```

## Common Issues & Solutions

### Issue 1: Wrong Endpoint
**Problem:** Frontend calling `/api/auth/register` instead of `/api/chefs/request-access`

**Solution:** Update frontend to use correct endpoint

### Issue 2: Missing Required Fields
**Problem:** Form only sending `firstName` and `lastName` but endpoint expects `email`, `password`, `name`

**Solution:** Either:
- Add missing fields to form, OR
- Change endpoint to team registration

### Issue 3: Invalid Head Chef ID
**Problem:** Team registration failing because `headChefId` doesn't exist

**Solution:** Use a valid head chef ID from your database

### Issue 4: CORS Issues
**Problem:** Frontend can't reach backend due to CORS

**Solution:** Check CORS configuration in backend

## Debug Script

Run the Node.js debug script:

```bash
# Set your API URL
export API_URL=https://your-deployed-api.com

# Run debug script
node scripts/debug-deployed-registration.js
```

## Frontend Form Analysis

Based on the form showing "james" and "bonds", this appears to be a **team member registration form** that should:

1. **Use endpoint:** `/api/chefs/request-access`
2. **Send data:**
   ```json
   {
     "headChefId": "valid_head_chef_id",
     "firstName": "james",
     "lastName": "bonds"
   }
   ```

## Next Steps

1. **Run the debug script** to identify the exact issue
2. **Check frontend code** to see which endpoint it's calling
3. **Verify head chef ID** exists in your database
4. **Update frontend** to use correct endpoint and data format
