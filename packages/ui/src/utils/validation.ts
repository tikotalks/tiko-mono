/**
 * Validation utility functions for the Tiko UI library
 * Provides common validation functions for forms and user input
 */

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns True if email format is valid
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns True if URL format is valid
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("invalid-url") // false
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates phone number format (basic validation)
 * @param phone - Phone number to validate
 * @returns True if phone format appears valid
 * @example
 * isValidPhone("+1234567890") // true
 * isValidPhone("123-456-7890") // true
 * isValidPhone("invalid") // false
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$|^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Validates that a string is not empty or only whitespace
 * @param value - String value to validate
 * @returns True if string has meaningful content
 * @example
 * isNotEmpty("hello") // true
 * isNotEmpty("   ") // false
 * isNotEmpty("") // false
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validates string length within specified range
 * @param value - String to validate
 * @param min - Minimum length (inclusive)
 * @param max - Maximum length (inclusive)
 * @returns True if length is within range
 * @example
 * isValidLength("hello", 3, 10) // true
 * isValidLength("hi", 3, 10) // false
 * isValidLength("very long string", 3, 10) // false
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  const length = value.length;
  return length >= min && length <= max;
}

/**
 * Validates that a number is within specified range
 * @param value - Number to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if number is within range
 * @example
 * isInRange(5, 1, 10) // true
 * isInRange(0, 1, 10) // false
 * isInRange(15, 1, 10) // false
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates password strength (basic rules)
 * @param password - Password to validate
 * @param options - Validation options
 * @returns Object with validation result and failed requirements
 * @example
 * validatePassword("MyPass123!") // { isValid: true, failedRules: [] }
 * validatePassword("weak") // { isValid: false, failedRules: ["minLength", "uppercase", "number", "special"] }
 */
export function validatePassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): { isValid: boolean; failedRules: string[] } {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;

  const failedRules: string[] = [];

  if (password.length < minLength) {
    failedRules.push('minLength');
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    failedRules.push('uppercase');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    failedRules.push('lowercase');
  }

  if (requireNumbers && !/\d/.test(password)) {
    failedRules.push('number');
  }

  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    failedRules.push('special');
  }

  return {
    isValid: failedRules.length === 0,
    failedRules
  };
}

/**
 * Validates that a value is a positive integer
 * @param value - Value to validate
 * @returns True if value is a positive integer
 * @example
 * isPositiveInteger(5) // true
 * isPositiveInteger(0) // false
 * isPositiveInteger(-1) // false
 * isPositiveInteger(3.14) // false
 */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/**
 * Validates that a value is a non-negative integer (including 0)
 * @param value - Value to validate
 * @returns True if value is a non-negative integer
 * @example
 * isNonNegativeInteger(5) // true
 * isNonNegativeInteger(0) // true
 * isNonNegativeInteger(-1) // false
 * isNonNegativeInteger(3.14) // false
 */
export function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Validates an array of values using a validator function
 * @param values - Array of values to validate
 * @param validator - Function to validate each value
 * @returns Object with overall validity and array of validation results
 * @example
 * validateArray([1, 2, 3], isPositiveInteger) // { isValid: true, results: [true, true, true] }
 * validateArray([1, -1, 3], isPositiveInteger) // { isValid: false, results: [true, false, true] }
 */
export function validateArray<T>(
  values: T[],
  validator: (value: T) => boolean
): { isValid: boolean; results: boolean[] } {
  const results = values.map(validator);
  return {
    isValid: results.every(result => result),
    results
  };
}