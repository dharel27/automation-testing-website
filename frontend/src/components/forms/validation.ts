// Validation utilities for form components

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character (@$!%*?&)',
    };
  }

  return { isValid: true };
};

export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  // US phone number validation (10 digits)
  if (digitsOnly.length === 10) {
    return { isValid: true };
  }

  // International format validation (7-15 digits)
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Please enter a valid phone number' };
};

export const validateRequired = (
  value: string,
  fieldName: string
): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): ValidationResult => {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters long`,
    };
  }
  return { isValid: true };
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): ValidationResult => {
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${maxLength} characters`,
    };
  }
  return { isValid: true };
};

export const validateUrl = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: true }; // URL is optional
  }

  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Please enter a valid URL' };
  }
};

export const validateAge = (age: string): ValidationResult => {
  if (!age) {
    return { isValid: false, error: 'Age is required' };
  }

  const ageNum = parseInt(age, 10);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    return {
      isValid: false,
      error: 'Please enter a valid age between 1 and 120',
    };
  }

  return { isValid: true };
};

export const validateZipCode = (zipCode: string): ValidationResult => {
  if (!zipCode) {
    return { isValid: false, error: 'ZIP code is required' };
  }

  // US ZIP code validation (5 digits or 5+4 format)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(zipCode)) {
    return {
      isValid: false,
      error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
    };
  }

  return { isValid: true };
};

// Format phone number for display
export const formatPhoneNumber = (phone: string): string => {
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }

  return phone;
};

// Remove formatting from phone number
export const unformatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};
