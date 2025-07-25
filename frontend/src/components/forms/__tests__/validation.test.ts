import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePhoneNumber,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateUrl,
  validateAge,
  validateZipCode,
  formatPhoneNumber,
  unformatPhoneNumber,
} from '../validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name+tag@domain.co.uk')).toEqual({
        isValid: true,
      });
      expect(validateEmail('test123@test-domain.com')).toEqual({
        isValid: true,
      });
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toEqual({
        isValid: false,
        error: 'Email is required',
      });
      expect(validateEmail('invalid-email')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address',
      });
      expect(validateEmail('test@')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address',
      });
      expect(validateEmail('@domain.com')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address',
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123!')).toEqual({ isValid: true });
      expect(validatePassword('MySecure@Pass1')).toEqual({ isValid: true });
      expect(validatePassword('Complex$Password9')).toEqual({ isValid: true });
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('')).toEqual({
        isValid: false,
        error: 'Password is required',
      });
      expect(validatePassword('short')).toEqual({
        isValid: false,
        error: 'Password must be at least 8 characters long',
      });
      expect(validatePassword('nouppercase123!')).toEqual({
        isValid: false,
        error: 'Password must contain at least one uppercase letter',
      });
      expect(validatePassword('NOLOWERCASE123!')).toEqual({
        isValid: false,
        error: 'Password must contain at least one lowercase letter',
      });
      expect(validatePassword('NoNumbers!')).toEqual({
        isValid: false,
        error: 'Password must contain at least one number',
      });
      expect(validatePassword('NoSpecialChar123')).toEqual({
        isValid: false,
        error: 'Password must contain at least one special character (@$!%*?&)',
      });
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('1234567890')).toEqual({ isValid: true });
      expect(validatePhoneNumber('(123) 456-7890')).toEqual({ isValid: true });
      expect(validatePhoneNumber('+1-123-456-7890')).toEqual({ isValid: true });
      expect(validatePhoneNumber('123.456.7890')).toEqual({ isValid: true });
      expect(validatePhoneNumber('+44 20 7946 0958')).toEqual({
        isValid: true,
      }); // International
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('')).toEqual({
        isValid: false,
        error: 'Phone number is required',
      });
      expect(validatePhoneNumber('123')).toEqual({
        isValid: false,
        error: 'Please enter a valid phone number',
      });
      expect(validatePhoneNumber('12345678901234567890')).toEqual({
        isValid: false,
        error: 'Please enter a valid phone number',
      });
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      expect(validateRequired('test', 'Field')).toEqual({ isValid: true });
      expect(validateRequired('   value   ', 'Field')).toEqual({
        isValid: true,
      });
    });

    it('should reject empty values', () => {
      expect(validateRequired('', 'Field')).toEqual({
        isValid: false,
        error: 'Field is required',
      });
      expect(validateRequired('   ', 'Field')).toEqual({
        isValid: false,
        error: 'Field is required',
      });
    });
  });

  describe('validateMinLength', () => {
    it('should validate values meeting minimum length', () => {
      expect(validateMinLength('hello', 5, 'Field')).toEqual({ isValid: true });
      expect(validateMinLength('hello world', 5, 'Field')).toEqual({
        isValid: true,
      });
    });

    it('should reject values below minimum length', () => {
      expect(validateMinLength('hi', 5, 'Field')).toEqual({
        isValid: false,
        error: 'Field must be at least 5 characters long',
      });
    });
  });

  describe('validateMaxLength', () => {
    it('should validate values within maximum length', () => {
      expect(validateMaxLength('hello', 10, 'Field')).toEqual({
        isValid: true,
      });
      expect(validateMaxLength('hello', 5, 'Field')).toEqual({ isValid: true });
    });

    it('should reject values exceeding maximum length', () => {
      expect(validateMaxLength('hello world', 5, 'Field')).toEqual({
        isValid: false,
        error: 'Field must be less than 5 characters',
      });
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toEqual({ isValid: true });
      expect(validateUrl('http://test.org/path?query=1')).toEqual({
        isValid: true,
      });
      expect(validateUrl('ftp://files.example.com')).toEqual({ isValid: true });
    });

    it('should allow empty URLs (optional)', () => {
      expect(validateUrl('')).toEqual({ isValid: true });
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('not-a-url')).toEqual({
        isValid: false,
        error: 'Please enter a valid URL',
      });
      expect(validateUrl('http://')).toEqual({
        isValid: false,
        error: 'Please enter a valid URL',
      });
    });
  });

  describe('validateAge', () => {
    it('should validate correct ages', () => {
      expect(validateAge('25')).toEqual({ isValid: true });
      expect(validateAge('1')).toEqual({ isValid: true });
      expect(validateAge('120')).toEqual({ isValid: true });
    });

    it('should reject invalid ages', () => {
      expect(validateAge('')).toEqual({
        isValid: false,
        error: 'Age is required',
      });
      expect(validateAge('0')).toEqual({
        isValid: false,
        error: 'Please enter a valid age between 1 and 120',
      });
      expect(validateAge('121')).toEqual({
        isValid: false,
        error: 'Please enter a valid age between 1 and 120',
      });
      expect(validateAge('not-a-number')).toEqual({
        isValid: false,
        error: 'Please enter a valid age between 1 and 120',
      });
    });
  });

  describe('validateZipCode', () => {
    it('should validate correct ZIP codes', () => {
      expect(validateZipCode('12345')).toEqual({ isValid: true });
      expect(validateZipCode('12345-6789')).toEqual({ isValid: true });
    });

    it('should reject invalid ZIP codes', () => {
      expect(validateZipCode('')).toEqual({
        isValid: false,
        error: 'ZIP code is required',
      });
      expect(validateZipCode('1234')).toEqual({
        isValid: false,
        error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
      });
      expect(validateZipCode('123456')).toEqual({
        isValid: false,
        error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
      });
      expect(validateZipCode('abcde')).toEqual({
        isValid: false,
        error: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
      });
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('should return original value for non-10-digit numbers', () => {
      expect(formatPhoneNumber('123456789')).toBe('123456789');
      expect(formatPhoneNumber('+1-123-456-7890')).toBe('+1-123-456-7890');
    });
  });

  describe('unformatPhoneNumber', () => {
    it('should remove all non-digit characters', () => {
      expect(unformatPhoneNumber('(123) 456-7890')).toBe('1234567890');
      expect(unformatPhoneNumber('+1-123-456-7890')).toBe('11234567890');
      expect(unformatPhoneNumber('123.456.7890')).toBe('1234567890');
      expect(unformatPhoneNumber('123 456 7890')).toBe('1234567890');
    });
  });
});
