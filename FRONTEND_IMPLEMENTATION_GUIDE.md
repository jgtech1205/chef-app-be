# 🎨 Frontend Implementation Guide for Team Member Login

## 📋 **Overview**

Your backend is now fully set up for team member login using **first name as username** and **last name as password**. Here's what you need to implement on the frontend.

## 🔗 **API Endpoint**

```
POST /api/auth/login-team-member
```

## 📤 **Request Format**

```json
{
  "restaurantName": "joes-pizza",
  "username": "John",     // First name
  "password": "Doe"       // Last name
}
```

## 📥 **Response Format**

### **Success (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "john.doe@joes-pizza.local",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "role": "team-member",
    "status": "active",
    "permissions": {
      "canViewRecipes": true,
      "canEditRecipes": false,
      // ... other permissions
    },
    "organization": "joes-pizza"
  },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "expiresIn": 86400
}
```

### **Error Responses:**
- **400**: Missing fields or validation errors
- **401**: Invalid first name or last name
- **403**: Account pending, rejected, or inactive
- **404**: Restaurant or team member not found
- **429**: Too many login attempts
- **500**: Server error

## 🎯 **Frontend Implementation Steps**

### **1. Create Team Member Login Component**

```typescript
// components/TeamMemberLogin.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface TeamMemberLoginProps {
  restaurantName: string;
  onLoginSuccess: (userData: any, tokens: any) => void;
  onLoginError: (error: string) => void;
}

const TeamMemberLogin: React.FC<TeamMemberLoginProps> = ({
  restaurantName,
  onLoginSuccess,
  onLoginError
}) => {
  const [formData, setFormData] = useState({
    username: '', // First name
    password: ''  // Last name
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login-team-member', {
        restaurantName,
        username: formData.username,
        password: formData.password
      });

      const { user, accessToken, refreshToken, expiresIn } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLoginSuccess(user, { accessToken, refreshToken, expiresIn });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      onLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="team-member-login">
      <h2>Team Member Login</h2>
      <p>Welcome to {restaurantName}</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">First Name</label>
          <input
            type="text"
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            placeholder="Enter your first name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Last Name</label>
          <input
            type="text"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            placeholder="Enter your last name"
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default TeamMemberLogin;
```

### **2. Create Restaurant-Specific Login Page**

```typescript
// pages/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TeamMemberLogin from '../components/TeamMemberLogin';

const LoginPage: React.FC = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const navigate = useNavigate();
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch restaurant details by slug
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(`/api/restaurants/by-slug/${restaurantSlug}`);
        setRestaurantName(response.data.name);
      } catch (error) {
        console.error('Restaurant not found');
        navigate('/404');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantSlug, navigate]);

  const handleLoginSuccess = (user: any, tokens: any) => {
    // Redirect to team member dashboard
    navigate(`/restaurant/${user.organization}/dashboard`);
  };

  const handleLoginError = (error: string) => {
    console.error('Login error:', error);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="branding">
          <h1>Chef en Place</h1>
          <p>Team Member Access</p>
        </div>
        
        <TeamMemberLogin
          restaurantName={restaurantName}
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
      </div>
    </div>
  );
};

export default LoginPage;
```

### **3. Update Routing**

```typescript
// App.tsx or your main router
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Restaurant-specific login pages */}
        <Route path="/login/:restaurantSlug" element={<LoginPage />} />
        
        {/* Other routes */}
        <Route path="/restaurant/:organizationId/dashboard" element={<TeamDashboard />} />
        {/* ... other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### **4. Create Team Member Dashboard**

```typescript
// components/TeamDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const TeamDashboard: React.FC = () => {
  const { organizationId } = useParams();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="team-dashboard">
      <header>
        <h1>Welcome, {user.firstName}!</h1>
        <p>Team Member Dashboard</p>
      </header>

      <div className="dashboard-content">
        <div className="user-info">
          <h3>Your Information</h3>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Status:</strong> {user.status}</p>
        </div>

        <div className="permissions">
          <h3>Your Permissions</h3>
          <ul>
            {user.permissions.canViewRecipes && <li>View Recipes</li>}
            {user.permissions.canEditRecipes && <li>Edit Recipes</li>}
            {user.permissions.canViewPlateups && <li>View Plateups</li>}
            {/* Add more permissions as needed */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
```

### **5. Add Authentication Context**

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  login: (userData: any, tokens: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (userData && token) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData: any, tokens: any) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 🎨 **CSS Styling Example**

```css
/* styles/TeamMemberLogin.css */
.team-member-login {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.team-member-login h2 {
  text-align: center;
  margin-bottom: 1rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
```

## 🚀 **Implementation Checklist**

- [ ] Create `TeamMemberLogin` component
- [ ] Create restaurant-specific login page
- [ ] Update routing for `/login/:restaurantSlug`
- [ ] Create team member dashboard
- [ ] Add authentication context
- [ ] Style components
- [ ] Test login flow
- [ ] Handle error states
- [ ] Add loading states
- [ ] Implement token refresh logic

## 🧪 **Testing the Implementation**

1. **Start your backend server**
2. **Navigate to** `http://localhost:3000/login/joes-pizza`
3. **Enter team member credentials:**
   - Username: First name (e.g., "John")
   - Password: Last name (e.g., "Doe")
4. **Verify successful login and redirect to dashboard**

## 📝 **Notes**

- The backend automatically converts restaurant names to slugs
- Team members must be approved (`status: 'active'`) to login
- Rate limiting is applied to prevent brute force attacks
- All login attempts are logged for security monitoring
- Tokens have role-based expiration times

Your backend is ready! Just implement these frontend components and you'll have a complete team member login system. 🎉
