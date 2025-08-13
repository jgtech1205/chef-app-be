# Error Handling Guide

## Overview

This guide documents the comprehensive error handling system implemented across all authentication endpoints. Each error response includes a specific message and error code for frontend integration.

## Error Response Format

All error responses follow this consistent format:

```json
{
  "message": "User-friendly error message",
  "error": "error_code_for_frontend",
  "status": "optional_status_field",
  "errors": "optional_validation_errors"
}
```

## HTTP Status Codes

### 400 Bad Request
**When:** Invalid input data, missing required fields, validation errors

### 401 Unauthorized
**When:** Invalid credentials, authentication required

### 403 Forbidden
**When:** Access denied, account status issues, pending/rejected access

### 404 Not Found
**When:** Resource not found (restaurant, team member, etc.)

### 500 Internal Server Error
**When:** Server errors, database issues, unexpected errors

## Authentication Endpoints Error Handling

### 1. Login by Name (`POST /api/auth/login-by-name`)

#### 400 Bad Request
```json
{
  "message": "Please fill in both first name and last name",
  "error": "missing_fields"
}
```

```json
{
  "message": "Invalid restaurant name",
  "error": "invalid_restaurant_name"
}
```

```json
{
  "message": "Please fill in both first name and last name",
  "error": "invalid_first_name"
}
```

```json
{
  "message": "Please fill in both first name and last name",
  "error": "invalid_last_name"
}
```

#### 403 Forbidden
```json
{
  "message": "Restaurant access is currently suspended",
  "error": "restaurant_suspended"
}
```

```json
{
  "message": "Your access request is still pending approval. Please contact the restaurant manager.",
  "error": "pending_approval",
  "status": "pending"
}
```

```json
{
  "message": "Your access request has been rejected. Please contact the restaurant manager.",
  "error": "access_rejected",
  "status": "rejected"
}
```

```json
{
  "message": "Account is not active",
  "error": "account_inactive",
  "status": "inactive"
}
```

```json
{
  "message": "Account is not active",
  "error": "account_deactivated"
}
```

#### 404 Not Found
```json
{
  "message": "Restaurant not found",
  "error": "restaurant_not_found"
}
```

```json
{
  "message": "Team member not found",
  "error": "team_member_not_found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Server error. Please try again later.",
  "error": "server_error"
}
```

### 2. QR Authentication (`POST /api/auth/qr/:orgId`)

#### 400 Bad Request
```json
{
  "message": "Invalid restaurant identifier",
  "error": "invalid_org_id"
}
```

#### 403 Forbidden
```json
{
  "message": "Restaurant access is currently suspended",
  "error": "restaurant_suspended"
}
```

#### 404 Not Found
```json
{
  "message": "Restaurant not found",
  "error": "restaurant_not_found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Server error. Please try again later.",
  "error": "server_error"
}
```

### 3. Team Member Registration (`POST /api/chefs/request-access`)

#### 400 Bad Request
```json
{
  "message": "Please fill in both first name and last name",
  "error": "validation_error",
  "errors": [...]
}
```

```json
{
  "message": "Invalid restaurant identifier",
  "error": "invalid_head_chef_id"
}
```

```json
{
  "message": "Please fill in both first name and last name",
  "error": "invalid_first_name"
}
```

```json
{
  "message": "Please fill in both first name and last name",
  "error": "invalid_last_name"
}
```

```json
{
  "message": "First name must be between 1 and 50 characters",
  "error": "invalid_first_name_length"
}
```

```json
{
  "message": "Last name must be between 1 and 50 characters",
  "error": "invalid_last_name_length"
}
```

```json
{
  "message": "A team member with this name already exists in this restaurant. Please use a different name or contact the restaurant manager.",
  "error": "duplicate_name"
}
```

#### 403 Forbidden
```json
{
  "message": "Restaurant access is currently suspended",
  "error": "head_chef_inactive"
}
```

#### 404 Not Found
```json
{
  "message": "Restaurant not found",
  "error": "head_chef_not_found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Server error. Please try again later.",
  "error": "server_error"
}
```

### 4. Main Login (`POST /api/auth/login`)

#### 400 Bad Request
```json
{
  "message": "Please provide a valid email and password",
  "error": "validation_error",
  "errors": [...]
}
```

```json
{
  "message": "Please provide a valid email and password",
  "error": "invalid_email"
}
```

```json
{
  "message": "Please provide a valid email and password",
  "error": "invalid_password"
}
```

#### 401 Unauthorized
```json
{
  "message": "Invalid email or password",
  "error": "invalid_credentials"
}
```

#### 403 Forbidden
```json
{
  "message": "Account is not active",
  "error": "account_deactivated"
}
```

```json
{
  "message": "Your access request is still pending approval. Please contact the restaurant manager.",
  "error": "pending_approval",
  "status": "pending"
}
```

```json
{
  "message": "Your access request has been rejected. Please contact the restaurant manager.",
  "error": "access_rejected",
  "status": "rejected"
}
```

```json
{
  "message": "Account is not active",
  "error": "account_inactive",
  "status": "inactive"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Server error. Please try again later.",
  "error": "server_error"
}
```

## Frontend Integration

### Error Code Mapping

Use the `error` field to handle specific error cases in your frontend:

```javascript
// Example frontend error handling
const handleLoginError = (error) => {
  switch (error.error) {
    case 'missing_fields':
      // Show field validation message
      break;
    case 'restaurant_not_found':
      // Show restaurant not found message
      break;
    case 'team_member_not_found':
      // Show team member not found message
      break;
    case 'pending_approval':
      // Show pending approval message
      break;
    case 'access_rejected':
      // Show access rejected message
      break;
    case 'account_inactive':
      // Show account inactive message
      break;
    case 'server_error':
      // Show generic server error message
      break;
    default:
      // Show generic error message
  }
};
```

### Status Field Usage

Some errors include a `status` field for additional context:

```javascript
// Example: Handle pending approval
if (error.error === 'pending_approval') {
  const status = error.status; // "pending"
  // Show appropriate UI based on status
}
```

### Validation Errors

For validation errors, the `errors` array contains detailed field-specific errors:

```javascript
// Example: Handle validation errors
if (error.error === 'validation_error') {
  error.errors.forEach(fieldError => {
    // fieldError.path - field name
    // fieldError.msg - field-specific error message
    // fieldError.value - invalid value
  });
}
```

## Error Message Guidelines

### User-Friendly Messages
- Clear and actionable
- No technical jargon
- Consistent tone and style
- Include next steps when appropriate

### Error Codes
- Descriptive and specific
- Consistent naming convention
- Easy to map to frontend logic
- Include context when needed

### Status Codes
- Use appropriate HTTP status codes
- Consistent across similar error types
- Follow REST API conventions

## Testing Error Handling

### Test Cases

1. **Missing Fields**
   - Send request without required fields
   - Verify 400 response with appropriate message

2. **Invalid Input**
   - Send malformed data
   - Verify 400 response with validation errors

3. **Not Found Scenarios**
   - Use non-existent restaurant/team member
   - Verify 404 response

4. **Access Denied**
   - Test with pending/rejected users
   - Verify 403 response with status

5. **Server Errors**
   - Simulate database/network errors
   - Verify 500 response

### Example Test Script

```javascript
// Test error handling
const testErrorHandling = async () => {
  const testCases = [
    {
      name: 'Missing fields',
      request: { restaurantName: '', firstName: '', lastName: '' },
      expectedStatus: 400,
      expectedError: 'missing_fields'
    },
    {
      name: 'Restaurant not found',
      request: { restaurantName: 'Non Existent', firstName: 'John', lastName: 'Doe' },
      expectedStatus: 404,
      expectedError: 'restaurant_not_found'
    },
    // Add more test cases...
  ];

  for (const testCase of testCases) {
    // Test implementation
  }
};
```

## Best Practices

1. **Consistent Format**: All error responses follow the same structure
2. **User-Friendly Messages**: Clear, actionable error messages
3. **Specific Error Codes**: Easy to handle in frontend
4. **Appropriate Status Codes**: Follow HTTP conventions
5. **Logging**: Log errors for debugging while keeping user messages clean
6. **Validation**: Comprehensive input validation
7. **Security**: Don't expose sensitive information in error messages
