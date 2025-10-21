import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listAvailableRulesTool, getRuleContentTool } from "./tools/rulesTools";
import { z } from 'zod';

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "MCP Rules Server",
		version: "1.0.0",
	});

	async init() {
		// Register listAvailableRulesTool
		this.server.tool(
			listAvailableRulesTool.name,
            listAvailableRulesTool.description,
            async () => {
                const result = await listAvailableRulesTool.execute();
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
		);

    const inputSchemaShape = getRuleContentTool.inputSchema instanceof z.ZodObject
        ? getRuleContentTool.inputSchema.shape
        : {};

		this.server.tool(
			getRuleContentTool.name,
            inputSchemaShape,
            async (args: unknown) => {
                const parsedArgs = getRuleContentTool.inputSchema.safeParse(args);
                if (!parsedArgs.success) {
                    return { content: [{ type: 'text', text: `Invalid input: ${parsedArgs.error.message}`}], isError: true };
                }
                const result = await getRuleContentTool.execute(parsedArgs.data);
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
		);
	}
}

// Rate Limiter Implementation
// Uses in-memory Map to track requests per IP
// Automatically cleans up old entries to prevent memory leaks
class RateLimiter {
	private requests: Map<string, number[]> = new Map();
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests = 10, windowMs = 60000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	check(ip: string): boolean {
		const now = Date.now();
		const timestamps = this.requests.get(ip) || [];

		// Remove timestamps outside the current window
		const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

		// Check if limit exceeded
		if (validTimestamps.length >= this.maxRequests) {
			return false;
		}

		// Add current timestamp
		validTimestamps.push(now);
		this.requests.set(ip, validTimestamps);

		// Periodically clean up old entries to prevent memory leaks
		if (this.requests.size > 1000) {
			this.cleanup(now);
		}

		return true;
	}

	private cleanup(now: number): void {
		for (const [ip, timestamps] of this.requests.entries()) {
			const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
			if (validTimestamps.length === 0) {
				this.requests.delete(ip);
			} else {
				this.requests.set(ip, validTimestamps);
			}
		}
	}
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Request validation helpers
function validateSSERequest(request: Request): { valid: boolean; error?: string } {
	// Check Accept header
	const accept = request.headers.get("Accept") || "";
	if (!accept.includes("text/event-stream") && !accept.includes("*/*")) {
		return { valid: false, error: "Invalid Accept header. Must accept text/event-stream" };
	}

	// Check User-Agent (block empty or suspicious)
	const userAgent = request.headers.get("User-Agent") || "";
	if (!userAgent || userAgent.length < 5) {
		return { valid: false, error: "Invalid or missing User-Agent" };
	}

	return { valid: true };
}

// Define more specific types for Env and ExecutionContext if known for the environment
// Example for Cloudflare Workers:
// interface Env { /* ... bindings ... */ }
// interface ExecutionContext { waitUntil(promise: Promise<any>): void; passThroughOnException(): void; }
export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Phase 1.2: Health Check Endpoint (no DO creation)
		if (url.pathname === "/health" || url.pathname === "/") {
			return new Response(JSON.stringify({
				status: "ok",
				version: "1.0.0",
				server: "MCP Rules Server"
			}), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=60"
				}
			});
		}

		// Phase 1.1: Rate Limiting (before DO creation)
		const ip = request.headers.get("CF-Connecting-IP") ||
			request.headers.get("X-Forwarded-For") ||
			"unknown";

		if (!rateLimiter.check(ip)) {
			return new Response(JSON.stringify({
				error: "Rate limit exceeded",
				message: "Too many requests. Please try again later.",
				retryAfter: 60
			}), {
				status: 429,
				headers: {
					"Content-Type": "application/json",
					"Retry-After": "60"
				}
			});
		}

		// Phase 1.2: Request Validation (for SSE endpoints)
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			const validation = validateSSERequest(request);
			if (!validation.valid) {
				return new Response(JSON.stringify({
					error: "Invalid request",
					message: validation.error
				}), {
					status: 400,
					headers: { "Content-Type": "application/json" }
				});
			}

			// Phase 1.4: Extract sessionId for session reuse tracking
			const sessionId = url.searchParams.get("sessionId");

			// @ts-expect-error - env is not typed
			const response = MyMCP.serveSSE("/sse").fetch(request, env, ctx);

			// Return response with session reuse headers
			return response.then((res) => {
				// If this is a new session (no sessionId provided), add headers to encourage reuse
				if (!sessionId && res.status === 200) {
					const newHeaders = new Headers(res.headers);
					newHeaders.set("X-Session-Reuse", "Please save sessionId from URL and reuse for reconnections");
					newHeaders.set("X-Session-Info", "Reusing sessions reduces server load and improves performance");
					return new Response(res.body, {
						status: res.status,
						statusText: res.statusText,
						headers: newHeaders
					});
				}
				return res;
			});
		}

		if (url.pathname === "/mcp") {
			// @ts-expect-error - env is not typed
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response(JSON.stringify({
			error: "Not found",
			availableEndpoints: ["/health", "/sse", "/mcp"]
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
	},
};
