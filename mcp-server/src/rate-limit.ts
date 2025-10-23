// Global IP-based rate limiting using Cloudflare KV
// Phase 2 implementation

// Configuration
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_KEY_PREFIX = "ratelimit:";

// Rate limit result interface
export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetTime: number; // Unix timestamp in seconds
}

/**
 * Extract client IP address from request
 * Uses cf-connecting-ip header (provided by Cloudflare)
 * Falls back to 127.0.0.1 for localhost testing
 */
export function getClientIP(request: Request): string {
	const ip = request.headers.get("cf-connecting-ip");

	// For localhost testing, use a default IP
	if (!ip || ip === "localhost") {
		return "127.0.0.1";
	}

	return ip;
}

/**
 * Check rate limit for an IP address
 * Returns the current count and whether the request should be allowed
 *
 * Uses simple counter with TTL approach:
 * - Key: ratelimit:${ip}
 * - Value: count (string)
 * - TTL: 60 seconds (auto-expires)
 *
 * @param kv - KV namespace binding
 * @param ip - Client IP address
 * @returns RateLimitResult with current rate limit state
 */
export async function checkRateLimit(
	kv: KVNamespace,
	ip: string
): Promise<RateLimitResult> {
	const key = `${RATE_LIMIT_KEY_PREFIX}${ip}`;

	try {
		// Get current count from KV
		const value = await kv.get(key);
		const currentCount = value ? parseInt(value, 10) : 0;

		// Check if over limit
		if (currentCount >= RATE_LIMIT_MAX_REQUESTS) {
			// Get metadata to determine reset time
			const metadata = await kv.getWithMetadata(key);
			const resetTime = metadata.metadata?.resetTime as number ||
				Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW_SECONDS;

			return {
				allowed: false,
				limit: RATE_LIMIT_MAX_REQUESTS,
				remaining: 0,
				resetTime
			};
		}

		// Calculate remaining requests
		const remaining = RATE_LIMIT_MAX_REQUESTS - currentCount - 1;
		const resetTime = Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW_SECONDS;

		return {
			allowed: true,
			limit: RATE_LIMIT_MAX_REQUESTS,
			remaining: remaining < 0 ? 0 : remaining,
			resetTime
		};
	} catch (error) {
		// Fail open: if KV is unavailable, allow the request
		console.error("Rate limit check failed:", error);
		return {
			allowed: true,
			limit: RATE_LIMIT_MAX_REQUESTS,
			remaining: RATE_LIMIT_MAX_REQUESTS - 1,
			resetTime: Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW_SECONDS
		};
	}
}

/**
 * Increment rate limit counter for an IP address
 * Creates new counter if it doesn't exist, increments if it does
 * Sets TTL to auto-expire after the rate limit window
 *
 * @param kv - KV namespace binding
 * @param ip - Client IP address
 * @param resetTime - Unix timestamp when the rate limit resets
 */
export async function incrementRateLimit(
	kv: KVNamespace,
	ip: string,
	resetTime: number
): Promise<void> {
	const key = `${RATE_LIMIT_KEY_PREFIX}${ip}`;

	try {
		// Get current count
		const value = await kv.get(key);
		const currentCount = value ? parseInt(value, 10) : 0;
		const newCount = currentCount + 1;

		// Store with TTL and metadata
		await kv.put(
			key,
			newCount.toString(),
			{
				expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
				metadata: { resetTime }
			}
		);
	} catch (error) {
		// Log error but don't fail the request
		console.error("Failed to increment rate limit:", error);
	}
}

/**
 * Create rate limit headers for response
 * Follows standard rate limiting header conventions:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests in current window
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 *
 * @param result - Rate limit result
 * @returns Object with header key-value pairs
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
	return {
		"X-RateLimit-Limit": result.limit.toString(),
		"X-RateLimit-Remaining": result.remaining.toString(),
		"X-RateLimit-Reset": result.resetTime.toString()
	};
}

/**
 * Create 429 Too Many Requests response
 * Includes:
 * - Retry-After header (seconds until reset)
 * - X-RateLimit-* headers
 * - JSON error body with details
 *
 * @param result - Rate limit result
 * @returns Response with 429 status
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
	const now = Math.floor(Date.now() / 1000);
	const retryAfter = result.resetTime - now;

	return new Response(JSON.stringify({
		error: "Too Many Requests",
		message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
		limit: result.limit,
		window: `${RATE_LIMIT_WINDOW_SECONDS} seconds`,
		resetTime: result.resetTime
	}), {
		status: 429,
		headers: {
			"Content-Type": "application/json",
			"Retry-After": retryAfter.toString(),
			...getRateLimitHeaders(result)
		}
	});
}
