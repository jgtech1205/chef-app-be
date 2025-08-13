# Name-Based Login System

## Overview

The Chef en Place backend now supports a dual login system:
- **Head Chefs**: Traditional email/password login
- **Team Members**: Name-based login (first name + last name)

## Database Schema Updates

### Restaurant Slug System

Restaurants now have a `slug` field for URL-friendly identifiers:

**Example:**
- Restaurant name: "Joe's Pizza"
- Slug: "joes-pizza"
- Login URL: `/login/joes-pizza`

**Slug Generation Rules:**
- Convert to lowercase
- Replace special characters with hyphens
- Remove leading/trailing hyphens
- Ensure uniqueness (add counter if needed)

### User Model Updates

The User model has been enhanced to support team member authentication:

**New Fields:**
- `firstName` (required) - Team member's first name
- `lastName` (required) - Team member's last name
- `name` (auto-generated) - Full name from firstName + lastName

**Updated Fields:**
- `role` - Now uses "team-member" instead of "user"
- `status` - Defaults to "pending" for team members
- `organization` - Indexed for efficient queries

**Database Indexes:**
- Compound index for team member lookups: `{ firstName, lastName, organization, role, status }`
- Organization members index: `{ organization, role, status }`
- Active team members index: `{ organization, role: "team-member", status: "active" }`

**Static Methods:**
- `User.findTeamMember(firstName, lastName, organization)` - Find team member by name
- `User.findActiveTeamMembers(organization)` - Find all active team members

**Migration:**
- Existing users get firstName/lastName automatically
- Role "user" updated to "team-member"
- Run migration script: `node scripts/migrate-user-names.js`

## Backend Changes Implemented

### 1. Frontend-Compatible Login Endpoint

**Endpoint:** `POST /api/auth/login-by-name`

**Request Body:**
```json
{
  "restaurantName": "Joe's Pizza",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "user123",
    "email": "john.doe.1234567890@chef.local",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "role": "team-member",
    "status": "active",
    "permissions": { ... },
    "organization": "joes-pizza"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

**Error Responses:**
- `400`: Missing required fields (restaurantName, firstName, lastName)
- `403`: Access denied, pending approval, or restaurant suspended
- `404`: Restaurant or team member not found

**Team Member Lookup:**
- Uses new static method: `User.findTeamMember(firstName, lastName, organization)`
- Case-insensitive name matching
- Proper status validation (active/pending/rejected)

### 2. Organization-Based Login Endpoint

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
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "role": "team-member",
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

### 3. Updated QR Endpoint

**Endpoint:** `POST /api/auth/qr/{orgId}`

**New Behavior:** Returns restaurant login URL instead of automatic login

**Response:**
```json
{
  "loginUrl": "https://app.chefenplace.com/login/joes-pizza",
  "restaurantName": "Joe's Pizza"
}
```

**How it works:**
1. **Find restaurant** by organization ID
2. **Generate login URL** using restaurant slug
3. **Return URL** for frontend redirect
4. **No automatic login** - just provides the login page URL

### 4. Updated Team Member Registration

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

**Registration Process:**
- Creates user with `firstName` and `lastName` fields
- Sets role to "team-member"
- Sets status to "pending"
- Auto-generates email and password
- Sets default view permissions

### 5. Name Uniqueness Validation

**Enhanced validation in team member registration:**
- Checks for duplicate names within same organization
- Uses case-insensitive matching for firstName/lastName
- Prevents multiple team members with same first + last name
- Clear error message for name conflicts

## User Experience Flow

### Head Chef Journey
1. **Creates restaurant** → Gets unique login URL with slug
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

### Slug Security
- ✅ **Unique slugs** - Each restaurant has a unique URL identifier
- ✅ **Automatic generation** - Slugs created from restaurant names
- ✅ **Collision handling** - Duplicate slugs get numbered suffixes

### User Model Security
- ✅ **Proper indexing** - Efficient queries for team member lookups
- ✅ **Role-based permissions** - Different permissions for different roles
- ✅ **Status tracking** - Proper active/pending/rejected status management
- ✅ **Name uniqueness** - Prevents duplicate names within organization

## API Endpoints Summary

| Endpoint | Method | Purpose | Users | Frontend Compatible |
|----------|--------|---------|-------|-------------------|
| `/api/auth/login` | POST | Email/password login | Head Chefs | ✅ |
| `/api/auth/login-by-name` | POST | Name-based login (restaurant name) | Team Members | ✅ |
| `/api/auth/login/name/{orgId}` | POST | Name-based login (org ID) | Team Members | ❌ |
| `/api/auth/qr/{orgId}` | POST | QR code → login URL | Team Members | ❌ |
| `/api/chefs/request-access` | POST | Register team member | Team Members | ✅ |

## Frontend Integration

### Recommended Frontend Endpoint

Use `/api/auth/login-by-name` for frontend implementation:

```javascript
// Frontend API call
const response = await fetch('/api/auth/login-by-name', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    restaurantName: 'Joe\'s Pizza',
    firstName: 'John',
    lastName: 'Doe'
  })
});

const data = await response.json();
if (response.ok) {
  // Login successful
  const { user, accessToken, refreshToken } = data;
  // Store tokens and redirect
} else {
  // Handle error
  console.error(data.message);
}
```

### URL Structure

**Restaurant Login URLs:**
- `/login/joes-pizza` - Joe's Pizza
- `/login/marias-cafe-bakery` - Maria's Café & Bakery
- `/login/downtown-bistro-123` - Downtown Bistro 123

**Slug Generation Examples:**
- "Joe's Pizza" → "joes-pizza"
- "Maria's Café & Bakery" → "marias-cafe-bakery"
- "Downtown Bistro 123" → "downtown-bistro-123"
- "Pizza!!!" → "pizza"

### Required Frontend Changes

1. **New Restaurant Login Pages**
   - Route: `/login/{restaurantSlug}`
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

## Database Migration

### Running the Migrations

```bash
# Run restaurant slug migration
node scripts/migrate-restaurant-slugs.js

# Run user name migration
node scripts/migrate-user-names.js
```

### Migration Process

**Restaurant Slug Migration:**
1. **Find all restaurants** without slugs
2. **Generate unique slugs** from restaurant names
3. **Update database** with new slug field
4. **Handle collisions** with numbered suffixes
5. **Report results** with summary

**User Name Migration:**
1. **Find all users** without firstName/lastName
2. **Parse existing names** into firstName/lastName
3. **Update role** from "user" to "team-member"
4. **Set proper defaults** for new fields
5. **Test static methods** for functionality

### Migration Output

```
🔄 Starting user name migration...

📊 Found 15 users to process

Processing: john.doe@example.com
  📝 Parsed name: John Doe (from: "John Doe")
  🔄 Updated role from "user" to "team-member"
  ✅ Updated successfully

🎉 Migration completed!
📊 Summary:
  ✅ Updated: 15 users
  ⏭️  Skipped: 0 users (already had firstName/lastName)
  ❌ Errors: 0 users

📋 Sample users with firstName/lastName:
  john.doe@example.com → John Doe (team-member)
  jane.smith@example.com → Jane Smith (team-member)
```

## Testing

Run the test script to verify functionality:
```bash
node scripts/test-slug-functionality.js
```

## Environment Variables

Add to your `.env` file:
```bash
FRONTEND_URL=https://app.chefenplace.com
MONGODB_URI=your_mongodb_connection_string
```

## Benefits

- ✅ **Simple for team members** - No passwords needed
- ✅ **Secure for head chefs** - Traditional authentication
- ✅ **Restaurant isolation** - Each restaurant has unique access
- ✅ **Easy sharing** - QR codes and login links
- ✅ **Consistent branding** - All restaurants use Chef en Place interface
- ✅ **Frontend compatible** - Clean API design for easy integration
- ✅ **URL-friendly** - Proper slugs for clean URLs
- ✅ **Automatic migration** - Existing data updated automatically
- ✅ **Efficient queries** - Proper indexing for fast lookups
- ✅ **Proper validation** - Case-insensitive name matching
