/**
 * Validation utility functions for input sanitization and security
 */

/**
 * UUID v4 regex pattern
 * Matches standard UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where y is one of [8, 9, a, b]
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID v4
 * @param value - The string to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_V4_REGEX.test(value);
}

/**
 * Validate and sanitize UUID input
 * @param value - The value to validate
 * @param paramName - Name of the parameter for error messages
 * @returns Object with validation result and error message if invalid
 */
export function validateUUID(
  value: unknown,
  paramName: string = 'ID',
): { valid: boolean; error?: string; value?: string } {
  if (!value) {
    return {
      valid: false,
      error: `${paramName} is required`,
    };
  }

  if (typeof value !== 'string') {
    return {
      valid: false,
      error: `${paramName} must be a string`,
    };
  }

  if (!isValidUUID(value)) {
    return {
      valid: false,
      error: `${paramName} must be a valid UUID`,
    };
  }

  return {
    valid: true,
    value: value.toLowerCase(), // Normalize to lowercase
  };
}

/**
 * Validate multiple UUIDs at once
 * @param values - Array of values to validate
 * @param paramName - Name of the parameter for error messages
 * @returns Object with validation result and error message if invalid
 */
export function validateUUIDs(
  values: unknown[],
  paramName: string = 'IDs',
): { valid: boolean; error?: string; values?: string[] } {
  if (!Array.isArray(values)) {
    return {
      valid: false,
      error: `${paramName} must be an array`,
    };
  }

  if (values.length === 0) {
    return {
      valid: false,
      error: `${paramName} cannot be empty`,
    };
  }

  const validatedValues: string[] = [];

  for (let i = 0; i < values.length; i++) {
    const result = validateUUID(values[i], `${paramName}[${i}]`);
    if (!result.valid) {
      return {
        valid: false,
        error: result.error,
      };
    }
    validatedValues.push(result.value!);
  }

  return {
    valid: true,
    values: validatedValues,
  };
}
