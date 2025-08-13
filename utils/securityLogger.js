const fs = require('fs');
const path = require('path');

// Configure logging
const LOG_DIR = path.join(__dirname, '../logs');
const SECURITY_LOG_FILE = path.join(LOG_DIR, 'security.log');
const LOGIN_ATTEMPTS_LOG_FILE = path.join(LOG_DIR, 'login-attempts.log');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  ALERT: 'ALERT'
};

// Write log entry
const writeLog = (filePath, entry) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${entry}\n`;
  
  try {
    fs.appendFileSync(filePath, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// Log login attempt
const logLoginAttempt = (data) => {
  const {
    ip,
    restaurantName,
    firstName,
    lastName,
    success,
    error,
    userAgent,
    timestamp = new Date()
  } = data;
  
  const logEntry = `LOGIN_ATTEMPT | IP: ${ip} | Restaurant: ${restaurantName} | Name: ${firstName} ${lastName} | Success: ${success} | Error: ${error || 'N/A'} | User-Agent: ${userAgent || 'N/A'}`;
  
  writeLog(LOGIN_ATTEMPTS_LOG_FILE, logEntry);
  
  // Also log to security log for suspicious activity
  if (!success) {
    logSecurityEvent({
      type: 'FAILED_LOGIN',
      ip,
      restaurantName,
      firstName,
      lastName,
      error,
      severity: 'WARN'
    });
  }
};

// Log security events
const logSecurityEvent = (data) => {
  const {
    type,
    ip,
    restaurantName,
    firstName,
    lastName,
    error,
    severity = 'INFO',
    details = {}
  } = data;
  
  const logEntry = `SECURITY_${severity} | Type: ${type} | IP: ${ip} | Restaurant: ${restaurantName || 'N/A'} | Name: ${firstName ? `${firstName} ${lastName}` : 'N/A'} | Error: ${error || 'N/A'} | Details: ${JSON.stringify(details)}`;
  
  writeLog(SECURITY_LOG_FILE, logEntry);
  
  // Alert on suspicious activity
  if (severity === 'ALERT') {
    console.error(`🚨 SECURITY ALERT: ${type} from IP ${ip}`);
    // In production, you might want to send email/SMS alerts here
  }
};

// Detect suspicious activity
const detectSuspiciousActivity = (ip, attempts) => {
  const suspiciousPatterns = [];
  
  // Multiple failed attempts from same IP
  if (attempts.count >= 3) {
    suspiciousPatterns.push('MULTIPLE_FAILED_ATTEMPTS');
  }
  
  // Rapid successive attempts (within 1 minute)
  if (attempts.count >= 2 && attempts.lastAttempt) {
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt < 60000) { // 1 minute
      suspiciousPatterns.push('RAPID_ATTEMPTS');
    }
  }
  
  // Multiple different restaurant attempts
  if (attempts.restaurants && attempts.restaurants.size > 3) {
    suspiciousPatterns.push('MULTIPLE_RESTAURANTS');
  }
  
  return suspiciousPatterns;
};

// Track login attempts per IP
const loginAttemptsTracker = new Map();

// Update login attempts tracking
const updateLoginAttempts = (ip, restaurantName, success) => {
  if (!loginAttemptsTracker.has(ip)) {
    loginAttemptsTracker.set(ip, {
      count: 0,
      lastAttempt: null,
      restaurants: new Set(),
      firstAttempt: Date.now()
    });
  }
  
  const data = loginAttemptsTracker.get(ip);
  data.count++;
  data.lastAttempt = Date.now();
  data.restaurants.add(restaurantName);
  
  // Check for suspicious activity
  const suspiciousPatterns = detectSuspiciousActivity(ip, data);
  
  if (suspiciousPatterns.length > 0) {
    logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      ip,
      restaurantName,
      severity: 'ALERT',
      details: {
        patterns: suspiciousPatterns,
        attemptCount: data.count,
        restaurants: Array.from(data.restaurants)
      }
    });
  }
  
  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  if (data.firstAttempt < oneHourAgo) {
    loginAttemptsTracker.delete(ip);
  }
};

// Reset login attempts for successful login
const resetLoginAttempts = (ip) => {
  if (loginAttemptsTracker.has(ip)) {
    loginAttemptsTracker.delete(ip);
  }
};

// Get login attempts for an IP
const getLoginAttempts = (ip) => {
  return loginAttemptsTracker.get(ip) || {
    count: 0,
    lastAttempt: null,
    restaurants: new Set(),
    firstAttempt: Date.now()
  };
};

// Log rate limit exceeded
const logRateLimitExceeded = (ip) => {
  logSecurityEvent({
    type: 'RATE_LIMIT_EXCEEDED',
    ip,
    severity: 'WARN'
  });
};

// Log blocked IP
const logBlockedIP = (ip, reason) => {
  logSecurityEvent({
    type: 'IP_BLOCKED',
    ip,
    severity: 'ALERT',
    details: { reason }
  });
};

// Export functions
module.exports = {
  logLoginAttempt,
  logSecurityEvent,
  updateLoginAttempts,
  resetLoginAttempts,
  getLoginAttempts,
  logRateLimitExceeded,
  logBlockedIP,
  LOG_LEVELS
};
