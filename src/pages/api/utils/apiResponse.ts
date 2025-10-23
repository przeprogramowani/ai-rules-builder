/**
 * Standardized API response helpers for consistent response formatting
 * across all API routes.
 */

export type ApiSuccessResponse<T = unknown> = {
  data?: T;
  message?: string;
  [key: string]: unknown;
};

export type ApiErrorResponse = {
  error: string;
  type?: string;
  errorCodes?: string[];
  retryAfter?: number;
  developerMessage?: string;
  [key: string]: unknown;
};

/**
 * Create a successful JSON response
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T = unknown>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an error JSON response
 * @param error - Error message
 * @param status - HTTP status code (default: 400)
 * @param options - Additional error details
 */
export function errorResponse(
  error: string,
  status: number = 400,
  options?: {
    type?: string;
    errorCodes?: string[];
    retryAfter?: number;
    developerMessage?: string;
    [key: string]: unknown;
  },
): Response {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Retry-After header if provided
  if (options?.retryAfter) {
    headers['Retry-After'] = options.retryAfter.toString();
  }

  return new Response(
    JSON.stringify({
      error,
      ...options,
    } as ApiErrorResponse),
    { status, headers },
  );
}

/**
 * Create a validation error response
 * @param message - Validation error message
 * @param fields - Optional field-specific errors
 */
export function validationError(message: string, fields?: Record<string, string>): Response {
  return errorResponse(message, 400, {
    type: 'validation_error',
    fields,
  });
}

/**
 * Create an unauthorized error response
 * @param message - Error message (default: 'Unauthorized')
 */
export function unauthorizedError(message: string = 'Unauthorized'): Response {
  return errorResponse(message, 401, {
    type: 'unauthorized',
  });
}

/**
 * Create a forbidden error response
 * @param message - Error message (default: 'Forbidden')
 */
export function forbiddenError(message: string = 'Forbidden'): Response {
  return errorResponse(message, 403, {
    type: 'forbidden',
  });
}

/**
 * Create a not found error response
 * @param message - Error message (default: 'Not found')
 */
export function notFoundError(message: string = 'Not found'): Response {
  return errorResponse(message, 404, {
    type: 'not_found',
  });
}

/**
 * Create a rate limit error response
 * @param message - Rate limit error message
 * @param retryAfter - Seconds until the user can retry
 */
export function rateLimitError(message: string, retryAfter: number): Response {
  return errorResponse(message, 429, {
    type: 'rate_limit',
    retryAfter,
  });
}

/**
 * Create an internal server error response
 * @param message - Error message (default: 'An unexpected error occurred')
 * @param developerMessage - Optional detailed error for development
 */
export function serverError(
  message: string = 'An unexpected error occurred',
  developerMessage?: string,
): Response {
  return errorResponse(message, 500, {
    type: 'server_error',
    developerMessage: import.meta.env.DEV ? developerMessage : undefined,
  });
}

/**
 * Create a service unavailable error response
 * @param message - Error message
 * @param retryAfter - Optional seconds until service is expected to be available
 */
export function serviceUnavailableError(
  message: string = 'Service temporarily unavailable',
  retryAfter?: number,
): Response {
  return errorResponse(message, 503, {
    type: 'service_unavailable',
    retryAfter,
  });
}
