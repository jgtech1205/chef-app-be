# 🔧 Team Member Dashboard Redirect Fix

## Problem
Team member gets approved and logged in, but is redirected back to the request form instead of the restaurant dashboard.

## Root Cause
The frontend auto-login function is not redirecting to the correct dashboard URL after successful login.

## Current Flow (Broken)
```
Team Member Approved → Auto-login → Redirect to request form ❌
```

## Expected Flow (Fixed)
```
Team Member Approved → Auto-login → Redirect to restaurant dashboard ✅
```

## Frontend Fix Required

### **Step 1: Update Auto-Login Function**
```javascript
// Current (broken) - redirects to wrong page
const autoLoginTeamMember = async (loginData) => {
  try {
    // Store tokens
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    
    // Update app state
    dispatch(setUser(loginData.user));
    dispatch(setAuthenticated(true));
    
    // ❌ Wrong redirect - goes back to request form
    window.location.href = '/request-form';
  } catch (error) {
    console.error('Auto-login failed:', error);
  }
};

// Fixed - redirects to restaurant dashboard
const autoLoginTeamMember = async (loginData) => {
  try {
    // Store tokens
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    
    // Update app state
    dispatch(setUser(loginData.user));
    dispatch(setAuthenticated(true));
    
    // ✅ Correct redirect - goes to restaurant dashboard
    const organizationId = loginData.user.organization;
    window.location.href = `/restaurant/${organizationId}/dashboard`;
    
    // OR if using React Router
    // navigate(`/restaurant/${organizationId}/dashboard`);
    
  } catch (error) {
    console.error('Auto-login failed:', error);
  }
};
```

### **Step 2: Get Organization ID for Redirect**
```javascript
// Option 1: From loginData (if available)
const autoLoginTeamMember = async (loginData) => {
  // ... store tokens ...
  
  // Get organization ID from user data
  const organizationId = loginData.user.organization;
  
  // Redirect to restaurant dashboard
  window.location.href = `/restaurant/${organizationId}/dashboard`;
};

// Option 2: From URL (if organization ID is in current URL)
const autoLoginTeamMember = async (loginData) => {
  // ... store tokens ...
  
  // Extract organization ID from current URL
  const currentUrl = window.location.href;
  const match = currentUrl.match(/\/restaurant\/([^\/]+)/);
  const organizationId = match ? match[1] : 'default';
  
  // Redirect to restaurant dashboard
  window.location.href = `/restaurant/${organizationId}/dashboard`;
};

// Option 3: From localStorage (if stored during registration)
const autoLoginTeamMember = async (loginData) => {
  // ... store tokens ...
  
  // Get organization ID from localStorage
  const organizationId = localStorage.getItem('organizationId') || 'default';
  
  // Redirect to restaurant dashboard
  window.location.href = `/restaurant/${organizationId}/dashboard`;
};
```

### **Step 3: Update Approval Handler**
```javascript
const approveTeamMember = async (memberId) => {
  const response = await fetch(`/api/users/team/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active' })
  });
  
  const result = await response.json();
  
  if (result.success) {
    if (result.loginData) {
      // ✅ Auto-login with correct redirect
      await autoLoginTeamMember(result.loginData);
    } else {
      showSuccessMessage('Team member updated');
    }
  }
};
```

### **Step 4: Handle Different User Roles**
```javascript
const autoLoginTeamMember = async (loginData) => {
  try {
    // Store tokens
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    
    // Update app state
    dispatch(setUser(loginData.user));
    dispatch(setAuthenticated(true));
    
    // Redirect based on user role
    const user = loginData.user;
    const organizationId = user.organization;
    
    if (user.role === 'user') {
      // Team member - go to restaurant dashboard
      window.location.href = `/restaurant/${organizationId}/dashboard`;
    } else if (user.role === 'head-chef') {
      // Head chef - go to head chef dashboard
      window.location.href = `/head-chef/dashboard`;
    } else {
      // Default - go to main dashboard
      window.location.href = `/dashboard`;
    }
    
  } catch (error) {
    console.error('Auto-login failed:', error);
  }
};
```

### **Step 5: Add Loading State**
```javascript
const autoLoginTeamMember = async (loginData) => {
  try {
    // Show loading state
    showLoadingMessage('Logging you in...');
    
    // Store tokens
    localStorage.setItem('accessToken', loginData.accessToken);
    localStorage.setItem('refreshToken', loginData.refreshToken);
    localStorage.setItem('user', JSON.stringify(loginData.user));
    
    // Update app state
    dispatch(setUser(loginData.user));
    dispatch(setAuthenticated(true));
    
    // Show success message
    showSuccessMessage(`Welcome ${loginData.user.name}!`);
    
    // Redirect with delay for better UX
    setTimeout(() => {
      const organizationId = loginData.user.organization;
      window.location.href = `/restaurant/${organizationId}/dashboard`;
    }, 1000);
    
  } catch (error) {
    console.error('Auto-login failed:', error);
    showErrorMessage('Login failed. Please try again.');
  }
};
```

## Dashboard URL Patterns

### **Common Dashboard URL Patterns:**
```javascript
// Pattern 1: Organization-based dashboard
`/restaurant/${organizationId}/dashboard`

// Pattern 2: Role-based dashboard
`/dashboard/${user.role}`

// Pattern 3: Simple dashboard
`/dashboard`

// Pattern 4: Team member specific
`/team-member/dashboard`
```

### **Determine Correct Dashboard URL:**
```javascript
const getDashboardUrl = (user) => {
  const organizationId = user.organization;
  
  // Check your app's routing structure
  if (user.role === 'user') {
    return `/restaurant/${organizationId}/dashboard`;
  } else if (user.role === 'head-chef') {
    return `/head-chef/dashboard`;
  } else {
    return `/dashboard`;
  }
};

const autoLoginTeamMember = async (loginData) => {
  // ... store tokens ...
  
  const dashboardUrl = getDashboardUrl(loginData.user);
  window.location.href = dashboardUrl;
};
```

## Testing

### **Test the Redirect:**
```javascript
// Test the redirect URL generation
const testRedirect = () => {
  const mockLoginData = {
    user: {
      id: 'user123',
      name: 'James Bonds',
      role: 'user',
      organization: 'restaurant123'
    }
  };
  
  const dashboardUrl = getDashboardUrl(mockLoginData.user);
  console.log('Redirect URL:', dashboardUrl);
  // Should output: /restaurant/restaurant123/dashboard
};
```

## Debugging

### **Add Console Logs:**
```javascript
const autoLoginTeamMember = async (loginData) => {
  console.log('Auto-login triggered with:', loginData);
  
  // ... store tokens ...
  
  const organizationId = loginData.user.organization;
  const dashboardUrl = `/restaurant/${organizationId}/dashboard`;
  
  console.log('Redirecting to:', dashboardUrl);
  window.location.href = dashboardUrl;
};
```

### **Check Current URL:**
```javascript
// Log current URL to understand routing
console.log('Current URL:', window.location.href);
console.log('Current pathname:', window.location.pathname);
```

## Common Issues & Solutions

### **Issue 1: Organization ID Missing**
```javascript
// Solution: Provide fallback
const organizationId = loginData.user.organization || 'default';
```

### **Issue 2: Wrong Dashboard URL Pattern**
```javascript
// Solution: Check your app's routing structure
// Update the URL pattern to match your app
```

### **Issue 3: React Router vs Window Location**
```javascript
// For React Router
navigate(`/restaurant/${organizationId}/dashboard`);

// For regular navigation
window.location.href = `/restaurant/${organizationId}/dashboard`;
```

## Expected Result

After the fix:
1. **Team member gets approved** → Auto-login triggered
2. **Tokens stored** → User authenticated
3. **Redirect happens** → Goes to `/restaurant/{organizationId}/dashboard`
4. **Team member sees dashboard** → Not the request form

The key is making sure the redirect URL matches your app's actual dashboard route structure! 🎯
