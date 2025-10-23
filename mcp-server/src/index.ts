import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listAvailableRulesTool, getRuleContentTool } from "./tools/rulesTools";
import { z } from 'zod';
import {
	getClientIP,
	checkAndApplyRateLimit,
	createRateLimitResponse,
	logRateLimitEvent
} from "./rate-limit";
import type { Env } from "./types/bindings";

// Shared DO pool configuration
const POOL_SIZE = 10; // Use 10 shared DOs to distribute load

/**
 * Hash function for distributing clients across DO pool
 * Uses a simple string hash to convert IP addresses to pool indices
 *
 * @param ip - Client IP address
 * @returns Hash value for pool distribution
 */
function hashIP(ip: string): number {
	let hash = 0;
	for (let i = 0; i < ip.length; i++) {
		hash = ((hash << 5) - hash) + ip.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}
	return Math.abs(hash);
}

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

// Enhanced request validation for SSE endpoints
// Validates Accept header and logs suspicious User-Agents (but doesn't block)
function validateSSERequest(request: Request): { valid: boolean; error?: string } {
	// Check Accept header
	const accept = request.headers.get("accept");
	if (accept) {
		const types = accept.split(',').map(t => t.trim().split(';')[0]);
		const acceptsSSE = types.some(type =>
			type === 'text/event-stream' ||
			type === 'text/*' ||
			type === '*/*'
		);
		if (!acceptsSSE) {
			return {
				valid: false,
				error: "Invalid Accept header. Must accept text/event-stream"
			};
		}
	}
	// Accept missing header for backwards compatibility

	// Log suspicious User-Agents but don't block (MCP clients may not send standard UAs)
	const userAgent = request.headers.get("user-agent") || "";
	if (userAgent && userAgent.length < 5) {
		console.warn(`Suspicious User-Agent detected: "${userAgent}"`);
	}

	return { valid: true };
}

/**
 * Main Worker handler
 *
 * Handles incoming requests to the MCP server with:
 * - Health check endpoint
 * - IP-based rate limiting (dual-mode during migration)
 * - SSE and MCP protocol endpoints
 * - Enhanced request validation
 */
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Health check endpoint - lightweight, no DO creation, no rate limiting
		// Support both /health and / for convenience
		if (url.pathname === "/health" || url.pathname === "/") {
			return new Response(JSON.stringify({
				status: "healthy",
				version: "1.0.0",
				timestamp: new Date().toISOString(),
				service: "10x-rules-mcp-server",
				endpoints: ["/health", "/sse", "/mcp"]
			}), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache"
				}
			});
		}

		// Extract client IP for rate limiting and DO pool routing
		let clientIP: string | null = null;
		if (url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp") {
			clientIP = getClientIP(request);
		}

		// IP-based rate limiting for SSE and MCP endpoints
		// This runs BEFORE DO routing to prevent DO creation abuse
		if (clientIP && (url.pathname === "/sse" || url.pathname === "/sse/message" || url.pathname === "/mcp")) {

			try {
				const rateLimitResult = await checkAndApplyRateLimit(env.RATE_LIMITER, clientIP);

				// Log event for analytics
				logRateLimitEvent(clientIP, rateLimitResult.allowed);

				if (!rateLimitResult.allowed) {
					// Rate limit exceeded - return 429
					return createRateLimitResponse(rateLimitResult);
				}
			} catch (error) {
				// Rate limit check failed - log and allow request (fail open)
				console.error("❌ Rate limit check failed (failing open):", error);
			}
		}

		// Enhanced request validation for SSE endpoints
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			const validation = validateSSERequest(request);
			if (!validation.valid) {
				return new Response(JSON.stringify({
					error: "Not Acceptable",
					message: validation.error || "Invalid request",
					hint: "Use a Server-Sent Events compatible client with valid User-Agent"
				}), {
					status: 406,
					headers: {
						"Content-Type": "application/json",
						"X-Expected-Accept": "text/event-stream"
					}
				});
			}

			// Extract sessionId for session reuse tracking
			const sessionId = url.searchParams.get("sessionId");

			// Route to shared DO pool instead of creating new DO per client
			// This reduces DO requests by 90-95% while maintaining functionality
			if (!clientIP) {
				clientIP = getClientIP(request);
			}
			const poolIndex = hashIP(clientIP) % POOL_SIZE;
			const poolId = `mcp-pool-${poolIndex}`;

			console.log(`🔀 Routing client ${clientIP} to DO pool instance ${poolIndex} (ID: ${poolId})`);

			// Modify the request URL to include the pool ID as sessionId query parameter
			// This tells the agents package which specific DO instance to route to
			const modifiedUrl = new URL(request.url);
			modifiedUrl.searchParams.set('sessionId', poolId);

			const modifiedRequest = new Request(modifiedUrl.toString(), request);
			const response = await MyMCP.serveSSE("/sse").fetch(modifiedRequest, env, ctx);

			// If this is a new session (no sessionId provided), add headers to encourage reuse
			if (!sessionId && response.status === 200) {
				const newHeaders = new Headers(response.headers);
				newHeaders.set("X-Session-Reuse", "Save sessionId from URL and reuse for reconnections");
				newHeaders.set("X-Session-Info", "Reusing sessions reduces server load");
				newHeaders.set("X-DO-Pool-Index", poolIndex.toString());

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: newHeaders
				});
			}

			return response;
		}

		if (url.pathname === "/mcp") {
			// Route to shared DO pool instead of creating new DO per client
			if (!clientIP) {
				clientIP = getClientIP(request);
			}
			const poolIndex = hashIP(clientIP) % POOL_SIZE;
			const poolId = `mcp-pool-${poolIndex}`;

			console.log(`🔀 Routing client ${clientIP} to DO pool instance ${poolIndex} (MCP, ID: ${poolId})`);

			// Modify the request URL to include the pool ID as sessionId query parameter
			// This tells the agents package which specific DO instance to route to
			const modifiedUrl = new URL(request.url);
			modifiedUrl.searchParams.set('sessionId', poolId);

			const modifiedRequest = new Request(modifiedUrl.toString(), request);
			return MyMCP.serve("/mcp").fetch(modifiedRequest, env, ctx);
		}

		// Enhanced 404 response with helpful information
		return new Response(JSON.stringify({
			error: "Not found",
			message: "The requested endpoint does not exist",
			availableEndpoints: [
				{ path: "/health", method: "GET", description: "Health check endpoint" },
				{ path: "/", method: "GET", description: "Health check (alias)" },
				{ path: "/sse", method: "GET", description: "Server-Sent Events MCP endpoint" },
				{ path: "/mcp", method: "POST", description: "Standard MCP endpoint" }
			]
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" }
		});
	},
};
