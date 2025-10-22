import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listAvailableRulesTool, getRuleContentTool } from "./tools/rulesTools";
import { z } from 'zod';
import {
	getClientIP,
	checkRateLimit,
	incrementRateLimit,
	createRateLimitResponse,
	getRateLimitHeaders
} from "./rate-limit";

// Define our MCP agent with tools (no DO-level rate limiting)
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

// Utility function to check if Accept header includes SSE
function acceptsSSE(acceptHeader: string | null): boolean {
	if (!acceptHeader) return true; // Backwards compatibility

	const types = acceptHeader.split(',').map(t => t.trim().split(';')[0]);
	return types.some(type =>
		type === 'text/event-stream' ||
		type === 'text/*' ||
		type === '*/*'
	);
}

// Define more specific types for Env and ExecutionContext if known for the environment
// Example for Cloudflare Workers:
// interface Env { /* ... bindings ... */ }
// interface ExecutionContext { waitUntil(promise: Promise<any>): void; passThroughOnException(): void; }
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Health check endpoint - lightweight, no DO creation, no rate limiting
		if (url.pathname === "/health") {
			return new Response(JSON.stringify({
				status: "healthy",
				version: "1.0.0",
				timestamp: new Date().toISOString(),
				service: "10x-rules-mcp-server"
			}), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache"
				}
			});
		}

		// Global IP-based rate limiting for SSE and MCP endpoints
		// This runs BEFORE DO routing to prevent DO creation abuse
		if (url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp") {
			// Extract client IP
			const clientIP = getClientIP(request);

			// Check if KV is available (may not be in local dev)
			// @ts-expect-error - env.RATE_LIMIT_KV exists but not typed
			if (env.RATE_LIMIT_KV) {
				// Check rate limit (fail open if KV unavailable)
				try {
					// @ts-expect-error - env.RATE_LIMIT_KV exists but not typed
					const rateLimitResult = await checkRateLimit(env.RATE_LIMIT_KV, clientIP);

					if (!rateLimitResult.allowed) {
						// Rate limit exceeded - return 429
						return createRateLimitResponse(rateLimitResult);
					}

					// Rate limit passed - increment counter
					// @ts-expect-error - env.RATE_LIMIT_KV exists but not typed
					await incrementRateLimit(env.RATE_LIMIT_KV, clientIP, rateLimitResult.resetTime);

					// Add rate limit headers to context for later use
					// (We can't add them to SSE responses directly without breaking the stream)
					ctx.rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
				} catch (error) {
					// Rate limit check failed - log and allow request (fail open)
					console.error("Rate limit check failed:", error);
				}
			} else {
				console.warn("Rate limiting disabled: KV namespace not available");
			}
		}

		// Accept header validation for SSE endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			const accept = request.headers.get("accept");

			if (!acceptsSSE(accept)) {
				return new Response(JSON.stringify({
					error: "Not Acceptable",
					message: "This endpoint requires 'Accept: text/event-stream' header",
					hint: "Use a Server-Sent Events compatible client",
					received: accept || "(none)"
				}), {
					status: 406,
					headers: {
						"Content-Type": "application/json",
						"X-Expected-Accept": "text/event-stream"
					}
				});
			}

			// @ts-expect-error - env is not typed
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			// @ts-expect-error - env is not typed
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
