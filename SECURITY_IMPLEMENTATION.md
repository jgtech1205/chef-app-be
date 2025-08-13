# Security Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented for the login-by-name endpoint and authentication system.

## 🔒 Security Features Implemented

### 1. Rate Limiting

#### Configuration
- **Limit**: 5 attempts per IP address
- **Window**: 15 minutes
- **Block Duration**: 15 minutes after 5 failed attempts
- **Reset**: Automatic reset after successful login

#### Implementation
```javascript
// Rate limiter middleware
const loginByNameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    message: "Too many login attempts. Please try again in 15 minutes.",
    error: "rate_limit_exceeded"
  }
});
```

#### Response Codes
- **429 Too Many Requests**: Rate limit exceeded
- **Error Code**: `rate_limit_exceeded`

### 2. Input Validation & Sanitization

#### Restaurant Name Validation
- **Allowed Characters**: Letters, numbers, hyphens, spaces, apostrophes
- **Length**: 1-100 characters
- **Sanitization**: Automatic removal of invalid characters

```javascript
const sanitizeRestaurantName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9\s\-']/g, '')
    .trim();
};
```

#### Name Validation
- **Allowed Characters**: Letters, spaces, hyphens, apostrophes
- **Length**: 1-50 characters
- **Pattern**: `/^[a-zA-Z\s\-']+$/`

```javascript
const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(trimmed) && 
         trimmed.length >= 1 && 
         trimmed.length <= 50;
};
```

#### Validation Middleware
```javascript
const loginByNameValidation = [
  body('restaurantName')
    .notEmpty()
    .isLength({ min: 1, max: 100 })
    .custom(sanitizeRestaurantName),
  body('firstName')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .custom(validateName),
  body('lastName')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .custom(validateName)
];
```

### 3. Comprehensive Logging

#### Log Files
- **Security Log**: `logs/security.log`
- **Login Attempts**: `logs/login-attempts.log`

#### Logged Information
- IP address
- Restaurant name
- User name (first/last)
- Success/failure status
- Error details
- User agent
- Timestamp

#### Log Format
```
[2024-01-15T10:30:00.000Z] LOGIN_ATTEMPT | IP: 192.168.1.100 | Restaurant: Joe's Pizza | Name: John Doe | Success: true | Error: N/A | User-Agent: Mozilla/5.0...
```

#### Security Events
- Failed login attempts
- Rate limit exceeded
- Suspicious activity
- Successful logins
- IP blocking

### 4. Token Security

#### Token Expiration Times
```javascript
const TOKEN_EXPIRATION = {
  ACCESS_TOKEN: "1h",           // 1 hour for head chefs
  REFRESH_TOKEN: "7d",          // 7 days for head chefs
  TEAM_MEMBER_ACCESS: "24h",    // 24 hours for team members
  TEAM_MEMBER_REFRESH: "30d"    // 30 days for team members
};
```

#### Secure Token Generation
- **Algorithm**: HS256
- **Unique Token ID**: 16-byte random hex
- **Additional Claims**: userId, tokenId, type, role, iat, exp
- **Role-based Expiration**: Different times for different user types

```javascript
const accessTokenPayload = {
  userId,
  tokenId: crypto.randomBytes(16).toString('hex'),
  type: 'access',
  role: userRole,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + getExpirationInSeconds(accessExpiration)
};
```

#### Token Verification
- Algorithm validation
- Structure validation
- Expiration checking
- Type validation

### 5. Suspicious Activity Detection

#### Detection Patterns
- **Multiple Failed Attempts**: 3+ failed attempts from same IP
- **Rapid Attempts**: 2+ attempts within 1 minute
- **Multiple Restaurants**: Attempts to 3+ different restaurants
- **Rate Limit Exceeded**: IP blocked due to rate limiting

#### Alert System
- **Console Alerts**: Immediate console warnings
- **Log Alerts**: Detailed logging with ALERT severity
- **Email/SMS**: Ready for production implementation

```javascript
if (severity === 'ALERT') {
  console.error(`🚨 SECURITY ALERT: ${type} from IP ${ip}`);
  // Production: Send email/SMS alerts
}
```

## 🛡️ Security Middleware Stack

### Route Protection
```javascript
router.post("/login-by-name", 
  // 1. Rate limiting
  loginByNameLimiter,
  trackLoginAttempts,
  
  // 2. Input validation
  loginByNameValidation,
  sanitizeLoginByNameInputs,
  
  // 3. Controller with logging
  authController.loginByName
);
```

### Middleware Order
1. **Rate Limiting**: Block excessive requests
2. **Input Validation**: Validate and sanitize inputs
3. **Controller**: Business logic with comprehensive logging

## 📊 Error Handling

### Security-Related Error Codes
- `rate_limit_exceeded`: Too many attempts
- `account_locked`: IP blocked
- `validation_error`: Input validation failed
- `invalid_restaurant_name_format`: Invalid restaurant name
- `invalid_first_name_format`: Invalid first name
- `invalid_last_name_format`: Invalid last name
- `suspicious_activity`: Suspicious behavior detected

### HTTP Status Codes
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (access denied)
- **404**: Not Found (resource not found)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## 🔍 Monitoring & Alerting

### Log Analysis
Monitor these patterns in logs:
- Failed login attempts per IP
- Rate limit violations
- Suspicious activity alerts
- Successful logins from new locations

### Production Recommendations
1. **Centralized Logging**: Use services like ELK Stack
2. **Real-time Alerts**: Set up email/SMS notifications
3. **IP Geolocation**: Track login locations
4. **Device Fingerprinting**: Track device patterns
5. **Anomaly Detection**: Machine learning for pattern recognition

## 🚀 Production Deployment

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secure-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d
JWT_TEAM_ACCESS_EXPIRES=24h
JWT_TEAM_REFRESH_EXPIRES=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_BLOCK_DURATION=900000  # 15 minutes

# Logging
LOG_LEVEL=INFO
SECURITY_LOG_LEVEL=WARN
```

### Security Headers
```javascript
// Add to your Express app
app.use(helmet());
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy());
```

### SSL/TLS
- Use HTTPS in production
- Implement HSTS headers
- Regular certificate renewal

## 📈 Performance Considerations

### Rate Limiting Storage
- **Development**: In-memory Map
- **Production**: Redis for distributed systems

### Log Rotation
- Implement log rotation to prevent disk space issues
- Compress old logs
- Set retention policies

### Token Storage
- Consider token blacklisting for logout
- Implement token refresh rotation
- Monitor token usage patterns

## 🔧 Testing Security Measures

### Test Cases
1. **Rate Limiting**: Send 6 requests, verify 429 response
2. **Input Validation**: Send invalid characters, verify 400 response
3. **Token Security**: Test expired tokens, verify 401 response
4. **Logging**: Verify all attempts are logged
5. **Suspicious Activity**: Test multiple failed attempts

### Security Testing Tools
- **OWASP ZAP**: Automated security testing
- **Burp Suite**: Manual security testing
- **Nmap**: Network security scanning
- **Custom Scripts**: Automated security validation

## 📋 Compliance & Best Practices

### OWASP Top 10 Coverage
- ✅ **A01:2021 – Broken Access Control**: Role-based access
- ✅ **A02:2021 – Cryptographic Failures**: Secure JWT implementation
- ✅ **A03:2021 – Injection**: Input validation and sanitization
- ✅ **A04:2021 – Insecure Design**: Secure by design approach
- ✅ **A05:2021 – Security Misconfiguration**: Proper configuration
- ✅ **A07:2021 – Identification and Authentication Failures**: Rate limiting, validation

### GDPR Compliance
- Log only necessary information
- Implement data retention policies
- Provide data deletion capabilities
- Document data processing activities

## 🚨 Incident Response

### Security Incident Types
1. **Rate Limit Violations**: Monitor for patterns
2. **Suspicious Activity**: Investigate unusual patterns
3. **Token Compromise**: Revoke and regenerate tokens
4. **Data Breach**: Follow incident response plan

### Response Procedures
1. **Detection**: Automated alerts trigger response
2. **Analysis**: Investigate the incident
3. **Containment**: Block malicious IPs/users
4. **Eradication**: Remove threats
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

## 📞 Support & Maintenance

### Regular Maintenance
- **Weekly**: Review security logs
- **Monthly**: Update security dependencies
- **Quarterly**: Security audit and penetration testing
- **Annually**: Security policy review

### Monitoring Checklist
- [ ] Failed login attempts trending
- [ ] Rate limit violations
- [ ] Suspicious activity alerts
- [ ] Token usage patterns
- [ ] System performance impact
- [ ] Error rate monitoring

This security implementation provides comprehensive protection for your authentication system while maintaining usability and performance.
