# Name-Based Login System

## Overview

The Chef en Place backend now supports a dual login system:
- **Head Chefs**: Traditional email/password login
- **Team Members**: Name-based login (first name + last name)

## Backend Changes Implemented

### 1. New Name-Based Login Endpoint

**Endpoint:** `POST /api/auth/login/name/{orgId}`

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user123",
    "email": "john.doe.1234567890@chef.local",
    "name": "John Doe",
    "role": "user",
    "status": "active",
    "permissions": { ... },
    "organization": "joes-pizza"
  },
  "restaurant": {
    "id": "restaurant123",
    "name": "Joe's Pizza",
    "organizationId": "joes-pizza"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

**Error Responses:**
- `400`: Missing first name or last name
- `401`: Team member not found or access denied
- `404`: Restaurant not found
- `403`: Restaurant access suspended

### 2. Updated QR Endpoint

**Endpoint:** `POST /api/auth/qr/{orgId}`

**New Behavior:** Returns login URL instead of automatic login

**Response:**
```json
{
  "message": "QR code scanned successfully",
  "loginUrl": "https://app.chefenplace.com/login/joes-pizza",
  "restaurant": {
    "id": "restaurant123",
    "name": "Joe's Pizza",
    "organizationId": "joes-pizza"
  }
}
```

### 3. Updated Team Member Approval

**When a team member is approved:**
- **Old:** Returns auto-login tokens
- **New:** Returns login URL for manual login

**Response:**
```json
{
  "success": true,
  "message": "Team member updated successfully",
  "data": { ... },
  "loginUrl": "https://app.chefenplace.com/login/joes-pizza"
}
```

### 4. Name Uniqueness Validation

**Enhanced validation in team member registration:**
- Checks for duplicate names within same organization
- Prevents multiple team members with same first + last name
- Clear error message for name conflicts

## User Experience Flow

### Head Chef Journey
1. **Creates restaurant** → Gets unique login URL
2. **Approves team members** → They get login URL
3. **Shares QR code** → Team members scan to get to login page
4. **Manages restaurant** → Traditional email/password login

### Team Member Journey
1. **Requests access** → Head chef approves
2. **Gets login URL** → Visits restaurant-specific page
3. **Enters name** → Gets logged in immediately
4. **Uses app** → Stays logged in (long-lived session)

## Security Features

### Name Validation
- ✅ **Case-insensitive matching** - "John Doe" matches "john doe"
- ✅ **Organization isolation** - Names only unique within same restaurant
- ✅ **Active user check** - Only active team members can login
- ✅ **Status validation** - Pending/rejected users get appropriate errors

### Access Control
- ✅ **Restaurant isolation** - Team members only access their restaurant
- ✅ **Permission system** - Head chef controls team member access
- ✅ **Session management** - Long-lived but secure sessions

## API Endpoints Summary

| Endpoint | Method | Purpose | Users |
|----------|--------|---------|-------|
| `/api/auth/login` | POST | Email/password login | Head Chefs |
| `/api/auth/login/name/{orgId}` | POST | Name-based login | Team Members |
| `/api/auth/qr/{orgId}` | POST | QR code → login URL | Team Members |
| `/api/chefs/request-access` | POST | Register team member | Team Members |

## Frontend Integration

### Required Frontend Changes

1. **New Restaurant Login Pages**
   - Route: `/login/{restaurantName}`
   - Form: First name + last name fields
   - Branding: Chef en Place with restaurant name

2. **Updated QR Code Handling**
   - QR codes redirect to login page
   - Remove automatic login from QR scanning

3. **Team Member Approval Flow**
   - Remove auto-login after approval
   - Show login URL after approval
   - Redirect to restaurant login page

4. **Main Login Page Updates**
   - Keep email/password for head chefs
   - Add option for restaurant-specific login

## Testing

Run the test script to verify functionality:
```bash
node scripts/test-name-login.js
```

## Environment Variables

Add to your `.env` file:
```bash
FRONTEND_URL=https://app.chefenplace.com
```

## Benefits

- ✅ **Simple for team members** - No passwords needed
- ✅ **Secure for head chefs** - Traditional authentication
- ✅ **Restaurant isolation** - Each restaurant has unique access
- ✅ **Easy sharing** - QR codes and login links
- ✅ **Consistent branding** - All restaurants use Chef en Place interface
