/**
 * CORS (Cross-Origin Resource Sharing) utility
 *
 * SECURITY NOTE: The prompt-library API should NOT use CORS headers.
 * This is an authenticated, same-origin API that should only accept requests
 * from the same domain. Adding CORS headers (especially '*') would:
 *
 * 1. Allow any website to make authenticated requests
 * 2. Expose sensitive organization data to malicious sites
 * 3. Violate security best practices
 *
 * This utility is provided for PUBLIC, unauthenticated endpoints only.
 */

/**
 * Get allowed origins from environment
 * Format: comma-separated list of origins
 * Example: "https://example.com,https://app.example.com"
 */
function getAllowedOrigins(): string[] {
  const envOrigins = import.meta.env.PUBLIC_CORS_ALLOWED_ORIGINS;
  if (!envOrigins || typeof envOrigins !== 'string') {
    return [];
  }
  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  const allowedOrigins = getAllowedOrigins();

  // If no origins configured, reject all cross-origin requests
  if (allowedOrigins.length === 0) {
    return false;
  }

  // Check if origin matches any allowed origin
  return allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for public, unauthenticated endpoints only
 *
 * WARNING: DO NOT use this for authenticated endpoints!
 *
 * @param requestOrigin - Origin from request headers
 * @param allowCredentials - Whether to allow credentials (should be false for public APIs)
 */
export function getCorsHeaders(
  requestOrigin: string | null,
  allowCredentials: boolean = false,
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Only set CORS headers if origin is allowed
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;

    if (allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }

    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

/**
 * Handle OPTIONS preflight request for CORS
 *
 * WARNING: Only use for public, unauthenticated endpoints!
 */
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin, false);

  // If no CORS headers (origin not allowed), reject
  if (Object.keys(corsHeaders).length === 0) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * SECURITY RECOMMENDATION:
 *
 * For authenticated APIs (like prompt-library):
 * - DO NOT add CORS headers
 * - Rely on same-origin policy
 * - Only serve requests from the same domain
 *
 * For public APIs (like MCP server):
 * - Use environment-based allowed origins
 * - Never use Access-Control-Allow-Origin: *
 * - Do not allow credentials with wildcard origins
 *
 * Current legacy endpoints (rule-collections) use '*' which is INSECURE.
 * These should be migrated to same-origin or use specific allowed origins.
 */
