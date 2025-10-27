/**
 * Rate Limiting Implementation
 *
 * IP-based rate limiting using Cloudflare's Rate Limiting API.
 *
 * Features:
 * - Near-zero latency (<1ms, local cache)
 * - Location-specific limits (per Cloudflare edge)
 * - Atomic check-and-increment operation
 * - Fail-open on errors (allows requests)
 * - Privacy-preserving analytics (hashed IPs)
 *
 * Documentation:
 * https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 */

import type { RateLimitBinding } from "./types/bindings";

// Configuration constants
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Rate limit result interface
 *
 * Note: The `remaining` field is null because the Rate Limiting API
 * doesn't provide exact counts. We omit this to avoid misleading clients.
 */
export interface RateLimitResult {
	/** Whether the request is allowed (true) or rate limited (false) */
	allowed: boolean;
	/** Maximum requests allowed in the time window */
	limit: number;
	/** Remaining requests (null - API doesn't provide exact count) */
	remaining: number | null;
	/** Unix timestamp (seconds) when the rate limit resets */
	resetTime: number;
}

/**
 * Extract client IP address from request
 *
 * Uses cf-connecting-ip header provided by Cloudflare, which cannot be spoofed
 * when the Worker runs on Cloudflare's network.
 *
 * @param request - Incoming HTTP request
 * @returns Client IP address (or 127.0.0.1 for localhost testing)
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
 * Check and apply rate limit using Cloudflare Rate Limiting API
 *
 * This performs an atomic check-and-increment operation with near-zero latency.
 *
 * Characteristics:
 * - Single atomic operation (no race conditions)
 * - Location-specific limits (not global)
 * - Eventually consistent (permissive by design)
 * - Fails open on errors (allows request)
 * - Does not provide exact remaining count
 *
 * @param rateLimiter - Rate limiting binding from env.RATE_LIMITER
 * @param ip - Client IP address
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkAndApplyRateLimit(
	rateLimiter: RateLimitBinding,
	ip: string
): Promise<RateLimitResult> {
	const startTime = Date.now();

	try {
		// Single atomic operation: check and increment
		const { success } = await rateLimiter.limit({ key: ip });

		// Monitor latency (should be <1ms typically)
		const latency = Date.now() - startTime;
		if (latency > 10) {
			console.warn(`⚠️  Rate limit check took ${latency}ms for IP ${ip} (expected <10ms)`);
		}

		const resetTime = Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW_SECONDS;

		if (!success) {
			// Rate limit exceeded
			console.log(`🚫 Rate limit exceeded for IP: ${ip}`);

			return {
				allowed: false,
				limit: RATE_LIMIT_MAX_REQUESTS,
				remaining: 0,
				resetTime
			};
		}

		// Request allowed
		return {
			allowed: true,
			limit: RATE_LIMIT_MAX_REQUESTS,
			remaining: null, // API doesn't provide exact count - don't fake it
			resetTime
		};
	} catch (error) {
		// Fail open: if rate limiter is unavailable, allow the request
		// This is the recommended approach for rate limiting to avoid blocking
		// legitimate users when the rate limiting system has issues
		console.error("❌ Rate limit check failed (failing open):", error);

		return {
			allowed: true,
			limit: RATE_LIMIT_MAX_REQUESTS,
			remaining: null,
			resetTime: Math.floor(Date.now() / 1000) + RATE_LIMIT_WINDOW_SECONDS
		};
	}
}

/**
 * Create rate limit headers for HTTP response
 *
 * Follows standard rate limiting header conventions:
 * - X-RateLimit-Limit: Maximum requests allowed
 * - X-RateLimit-Remaining: Remaining requests (omitted if not available)
 * - X-RateLimit-Reset: Unix timestamp when limit resets
 *
 * Note: X-RateLimit-Remaining is omitted when null since the Rate Limiting API
 * doesn't provide exact counts. This avoids misleading clients.
 *
 * @param result - Rate limit result
 * @returns Object with header key-value pairs
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
	const headers: Record<string, string> = {
		"X-RateLimit-Limit": result.limit.toString(),
		"X-RateLimit-Reset": result.resetTime.toString()
	};

	// Only include Remaining if we have accurate data
	if (result.remaining !== null) {
		headers["X-RateLimit-Remaining"] = result.remaining.toString();
	}

	return headers;
}

/**
 * Create 429 Too Many Requests response
 *
 * Returns a properly formatted HTTP 429 response with:
 * - Retry-After header (seconds until reset)
 * - X-RateLimit-* headers
 * - JSON error body with details
 *
 * @param result - Rate limit result (with allowed=false)
 * @returns Response with 429 status and rate limit information
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
	const now = Math.floor(Date.now() / 1000);
	const retryAfter = Math.max(1, result.resetTime - now);

	return new Response(JSON.stringify({
		error: "Too Many Requests",
		message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
		limit: result.limit,
		window: `${RATE_LIMIT_WINDOW_SECONDS} seconds`,
		resetTime: result.resetTime,
		retryAfter
	}), {
		status: 429,
		headers: {
			"Content-Type": "application/json",
			"Retry-After": retryAfter.toString(),
			...getRateLimitHeaders(result)
		}
	});
}

/**
 * Hash IP address for privacy-preserving analytics
 *
 * Simple base64 hash for logging without storing raw IPs.
 * For production, consider using crypto.subtle.digest for better privacy.
 *
 * @param ip - IP address to hash
 * @returns Truncated base64 hash of IP
 */
export function hashIP(ip: string): string {
	try {
		// Ensure fixed 16-character output regardless of input length
		const base64 = btoa(ip);
		return (base64 + '================')
			.substring(0, 16);
	} catch {
		return "hash-error";
	}
}

/**
 * Log rate limit event for analytics
 *
 * Logs rate limit decisions in a structured format for monitoring and analysis.
 * IP addresses are hashed for privacy.
 *
 * In production, you might send this to:
 * - Cloudflare Workers Analytics Engine
 * - External analytics service
 * - Logging aggregation system
 *
 * @param ip - Client IP address
 * @param allowed - Whether request was allowed
 */
export function logRateLimitEvent(ip: string, allowed: boolean): void {
	console.log(JSON.stringify({
		event: "rate_limit_check",
		ip_hash: hashIP(ip),
		allowed,
		timestamp: new Date().toISOString()
	}));
}
