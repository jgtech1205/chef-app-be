const { body, validationResult } = require('express-validator');

// Sanitize restaurant name (only letters, numbers, hyphens, spaces, apostrophes)
const sanitizeRestaurantName = (name) => {
  if (!name || typeof name !== 'string') return null;
  
  // Remove any characters that aren't letters, numbers, hyphens, spaces, or apostrophes
  const sanitized = name
    .replace(/[^a-zA-Z0-9\s\-']/g, '')
    .trim();
  
  return sanitized.length > 0 ? sanitized : null;
};

// Validate first/last names (only letters, spaces, hyphens, apostrophes)
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 50) return false;
  
  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(trimmed);
};

// Validate input lengths
const validateInputLengths = {
  restaurantName: { min: 1, max: 100 },
  firstName: { min: 1, max: 50 },
  lastName: { min: 1, max: 50 }
};

// Check if input length is within limits
const checkInputLength = (value, field) => {
  if (!value || typeof value !== 'string') return false;
  
  const limits = validateInputLengths[field];
  if (!limits) return true; // No limits defined for this field
  
  const length = value.trim().length;
  return length >= limits.min && length <= limits.max;
};

// Comprehensive validation for login-by-name endpoint
const loginByNameValidation = [
  body('restaurantName')
    .notEmpty()
    .withMessage('Restaurant name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Restaurant name must be between 1 and 100 characters')
    .custom((value) => {
      const sanitized = sanitizeRestaurantName(value);
      if (!sanitized) {
        throw new Error('Invalid restaurant name format');
      }
      return true;
    }),
  
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .custom((value) => {
      if (!validateName(value)) {
        throw new Error('First name contains invalid characters');
      }
      return true;
    }),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .custom((value) => {
      if (!validateName(value)) {
        throw new Error('Last name contains invalid characters');
      }
      return true;
    })
];

// Sanitize all inputs for login-by-name
const sanitizeLoginByNameInputs = (req, res, next) => {
  try {
    const { restaurantName, firstName, lastName } = req.body;
    
    // Sanitize restaurant name
    if (restaurantName) {
      const sanitized = sanitizeRestaurantName(restaurantName);
      if (!sanitized) {
        return res.status(400).json({
          message: "Invalid restaurant name format",
          error: "invalid_restaurant_name_format"
        });
      }
      req.body.restaurantName = sanitized;
    }
    
    // Sanitize first name
    if (firstName) {
      const trimmed = firstName.trim();
      if (!validateName(trimmed)) {
        return res.status(400).json({
          message: "First name contains invalid characters",
          error: "invalid_first_name_format"
        });
      }
      req.body.firstName = trimmed;
    }
    
    // Sanitize last name
    if (lastName) {
      const trimmed = lastName.trim();
      if (!validateName(trimmed)) {
        return res.status(400).json({
          message: "Last name contains invalid characters",
          error: "invalid_last_name_format"
        });
      }
      req.body.lastName = trimmed;
    }
    
    next();
  } catch (error) {
    console.error('Input sanitization error:', error);
    res.status(400).json({
      message: "Invalid input format",
      error: "input_sanitization_error"
    });
  }
};

module.exports = {
  sanitizeRestaurantName,
  validateName,
  checkInputLength,
  loginByNameValidation,
  sanitizeLoginByNameInputs
};
