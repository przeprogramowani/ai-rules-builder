import { type AstroCookies } from 'astro';

const RATE_LIMIT_COOKIE_NAME = 'app_rl_v1';
const DEFAULT_RATE_LIMIT_SECONDS = 10;

// Type for the cookie value: a map of routes to their last access timestamps
type RateLimitData = {
  [route: string]: number; // route: timestamp
};

export function checkRateLimit(
  cookies: AstroCookies,
  route: string,
  rateLimitSeconds: number = DEFAULT_RATE_LIMIT_SECONDS,
): boolean {
  const cookie = cookies.get(RATE_LIMIT_COOKIE_NAME);
  if (!cookie?.value) {
    return true; // No cookie, or empty cookie value, allow
  }

  try {
    const decodedValue = atob(cookie.value);
    const rateLimitData = JSON.parse(decodedValue) as RateLimitData;
    const lastAccessTime = rateLimitData[route];

    if (!lastAccessTime) {
      return true; // No timestamp for this route yet, allow
    }

    const timeSinceLastAccess = Date.now() - lastAccessTime;
    if (timeSinceLastAccess < rateLimitSeconds * 1000) {
      console.log(
        `Rate limit exceeded for route: ${route}. Time since last access: ${timeSinceLastAccess}ms, Limit: ${rateLimitSeconds * 1000}ms`,
      );
      return false; // Rate limit exceeded
    }
    return true; // Rate limit not exceeded
  } catch (error) {
    console.error('Error decoding or parsing rate limit cookie:', error);
    // If there's an error (e.g., malformed cookie), allow the request and overwrite the cookie later.
    // Alternatively, you could block to be safer, depending on requirements.
    return true;
  }
}

export function setRateLimitCookie(
  cookies: AstroCookies,
  route: string,
  rateLimitSeconds: number = DEFAULT_RATE_LIMIT_SECONDS,
): void {
  const currentTime = Date.now();
  let rateLimitData: RateLimitData = {};

  const existingCookie = cookies.get(RATE_LIMIT_COOKIE_NAME);
  if (existingCookie?.value) {
    try {
      const decodedValue = atob(existingCookie.value);
      rateLimitData = JSON.parse(decodedValue) as RateLimitData;
    } catch (error) {
      console.error('Error decoding or parsing existing rate limit cookie:', error);
      // If cookie is malformed, start fresh
      rateLimitData = {};
    }
  }

  rateLimitData[route] = currentTime;

  // Clean up old entries (optional, but good for cookie size management)
  // This example doesn't include cleanup, but you might want to add it if routes are dynamic or numerous.

  try {
    const newCookieValue = btoa(JSON.stringify(rateLimitData));
    cookies.set(RATE_LIMIT_COOKIE_NAME, newCookieValue, {
      path: '/',
      maxAge: Math.max(rateLimitSeconds, DEFAULT_RATE_LIMIT_SECONDS) * 2, // Cookie should last longer than the longest rate limit
      sameSite: 'lax',
      httpOnly: true, // Make cookie httpOnly for security
    });
  } catch (error) {
    console.error('Error encoding or setting rate limit cookie:', error);
  }
}
