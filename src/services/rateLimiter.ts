const RATE_LIMIT_COOKIE_NAME = 'login_attempt_timestamp';
const RATE_LIMIT_SECONDS = 10;

/**
 * Checks if the request is rate-limited based on a timestamp in an HTTP-only cookie.
 * @param headers The Headers object from the request.
 * @returns True if the request is allowed, false if it's rate-limited.
 */
export function checkRateLimit(headers: Headers): boolean {
  const lastAttemptTimestamp = headers
    .get('cookie')
    ?.split('; ')
    .find((row) => row.startsWith(`${RATE_LIMIT_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (lastAttemptTimestamp) {
    const lastAttemptTime = parseInt(lastAttemptTimestamp, 10);
    const currentTime = Date.now();
    if (currentTime - lastAttemptTime < RATE_LIMIT_SECONDS * 1000) {
      return false; // Rate-limited
    }
  }
  return true; // Allowed
}

/**
 * Sets an HTTP-only cookie with the current timestamp to track the last login attempt.
 * @param responseHeaders The Headers object to add the Set-Cookie header to.
 */
export function setRateLimitCookie(responseHeaders: Headers): void {
  const currentTime = Date.now();
  responseHeaders.append(
    'Set-Cookie',
    `${RATE_LIMIT_COOKIE_NAME}=${currentTime}; HttpOnly; Path=/; Max-Age=${RATE_LIMIT_SECONDS}; SameSite=Lax`,
  );
}
