/**
 * Form validation utilities
 * Client-side validation for better UX
 */

export const validators = {
  // Email validation
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email kiritilishi kerak';
    if (!regex.test(email)) return 'Noto\'g\'ri email format';
    return null;
  },

  // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: (password) => {
    if (!password) return 'Parol kiritilishi kerak';
    if (password.length < 8) return 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak';
    if (!/[A-Z]/.test(password)) return 'Parolda kamida 1 ta katta harf bo\'lishi kerak';
    if (!/[a-z]/.test(password)) return 'Parolda kamida 1 ta kichik harf bo\'lishi kerak';
    if (!/[0-9]/.test(password)) return 'Parolda kamida 1 ta raqam bo\'lishi kerak';
    return null;
  },

  // Password confirmation
  passwordMatch: (password, confirmPassword) => {
    if (!confirmPassword) return 'Parolni tasdiqlang';
    if (password !== confirmPassword) return 'Parollar mos kelmadi';
    return null;
  },

  // Required field
  required: (value, fieldName = 'Maydon') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} kiritilishi kerak`;
    }
    return null;
  },

  // Minimum length
  minLength: (value, min, fieldName = 'Maydon') => {
    if (!value || value.length < min) {
      return `${fieldName} kamida ${min} ta belgidan iborat bo\'lishi kerak`;
    }
    return null;
  },

  // Maximum length
  maxLength: (value, max, fieldName = 'Maydon') => {
    if (value && value.length > max) {
      return `${fieldName} ko\'pi bilan ${max} ta belgi bo\'lishi mumkin`;
    }
    return null;
  },

  // Number validation
  positiveNumber: (value, fieldName = 'Maydon') => {
    if (value === '' || value === null || value === undefined) return null;
    const num = Number(value);
    if (isNaN(num)) return `${fieldName} raqam bo\'lishi kerak`;
    if (num <= 0) return `${fieldName} musbat son bo\'lishi kerak`;
    return null;
  },

  // Budget validation (max 1 million dollars)
  budget: (value) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) return 'Byudjet raqam bo\'lishi kerak';
    if (num < 5) return 'Byudjet kamida $5 bo\'lishi kerak';
    if (num > 1000000) return 'Byudjet $1,000,000 dan oshmasligi kerak';
    return null;
  },

  // File size validation (default max 50MB)
  fileSize: (file, maxSizeMB = 50) => {
    if (!file) return null;
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Fayl hajmi ${maxSizeMB}MB dan oshmasligi kerak (joriy: ${(file.size / 1024 / 1024).toFixed(2)}MB)`;
    }
    return null;
  },

  // Phone number validation
  phone: (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) return 'Telefon raqami kamida 9 ta raqamdan iborat bo\'lishi kerak';
    return null;
  },

  // Skills array validation
  skills: (skills) => {
    if (!skills || !Array.isArray(skills)) return null;
    if (skills.length === 0) return null;
    if (skills.length > 20) return 'Ko\'nikmalar soni 20 dan oshmasligi kerak';
    for (const skill of skills) {
      if (skill.length > 50) return `Ko\'nikma nomi "${skill.substring(0, 20)}..." juda uzun (max 50 ta belgi)`;
    }
    return null;
  },

  // Deadline validation (must be in future)
  deadline: (date) => {
    if (!date) return null;
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) return 'Muddat kelajak sanadan bo\'lishi kerak';
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (selected > maxDate) return 'Muddat 2 yildan oshmasligi kerak';
    return null;
  }
};

/**
 * Validate multiple fields at once
 * @param {Object} fields - Object with field names and validation functions
 * @returns {Object} - Object with errors (empty if no errors)
 */
export const validateForm = (fields) => {
  const errors = {};
  
  for (const [fieldName, validateFn] of Object.entries(fields)) {
    const error = validateFn();
    if (error) {
      errors[fieldName] = error;
    }
  }
  
  return errors;
};

/**
 * Extract first error message from validation errors object
 * @param {Object} errors - Validation errors object
 * @returns {string|null} - First error message or null
 */
export const getFirstError = (errors) => {
  const values = Object.values(errors);
  return values.length > 0 ? values[0] : null;
};

/**
 * Format API error response to human-readable message
 * @param {Object} errorResponse - Error response from API
 * @returns {string} - Formatted error message
 */
export const formatApiError = (errorResponse) => {
  if (!errorResponse) return 'Noma\'lum xatolik yuz berdi';
  
  if (typeof errorResponse === 'string') return errorResponse;
  
  if (errorResponse.detail) return errorResponse.detail;
  if (errorResponse.message) return errorResponse.message;
  
  const messages = [];
  for (const [key, value] of Object.entries(errorResponse)) {
    if (Array.isArray(value)) {
      messages.push(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'string') {
      messages.push(`${key}: ${value}`);
    }
  }
  
  return messages.length > 0 ? messages.join('; ') : 'So\'rovda xatolik';
};
