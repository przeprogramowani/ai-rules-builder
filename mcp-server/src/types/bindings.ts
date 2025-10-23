/**
 * TypeScript type definitions for Cloudflare Worker bindings
 *
 * This file provides type safety for all environment bindings used in the MCP server.
 */

/**
 * Cloudflare Rate Limiting API Binding
 *
 * Documentation: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 *
 * The Rate Limiting API provides location-specific rate limiting with local caching.
 * - Counters are cached on the same machine the Worker runs on
 * - No meaningful latency added to requests (<1ms typically)
 * - Eventually consistent (permissive by design)
 * - Designed for abuse prevention, not accurate accounting
 */
export interface RateLimitBinding {
	/**
	 * Check and increment rate limit for a given key
	 *
	 * This is an atomic operation that both checks and increments the counter.
	 * The key can be any string (typically IP address, user ID, or API key).
	 *
	 * @param options - Configuration object with key
	 * @returns Promise resolving to success status
	 *
	 * @example
	 * const { success } = await env.RATE_LIMITER.limit({ key: clientIP });
	 * if (!success) {
	 *   return new Response("Too many requests", { status: 429 });
	 * }
	 */
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

/**
 * Durable Object Namespace Binding
 *
 * Used for MCP server session management
 */
export interface DurableObjectNamespace {
	newUniqueId(): DurableObjectId;
	idFromName(name: string): DurableObjectId;
	idFromString(id: string): DurableObjectId;
	get(id: DurableObjectId): DurableObjectStub;
}

export interface DurableObjectId {
	toString(): string;
	equals(other: DurableObjectId): boolean;
}

export interface DurableObjectStub {
	fetch(request: Request): Promise<Response>;
}

/**
 * Environment bindings for the MCP server Worker
 *
 * This interface defines all available bindings and environment variables.
 */
export interface Env {
	/**
	 * Cloudflare Rate Limiting API binding
	 *
	 * Configured in wrangler.jsonc under "ratelimits".
	 * Provides low-latency, location-specific rate limiting.
	 */
	RATE_LIMITER: RateLimitBinding;

	/**
	 * Durable Object namespace for MCP server sessions
	 */
	MCP_OBJECT: DurableObjectNamespace;
}
