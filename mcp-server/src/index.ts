import { McpAgent } from "agents/mcp";
// Only import McpServer if helper types are not available/exported
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Import the rules tools
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
            // Callback function - use 'any' for extra due to type export issues
            async (/* extra: any */) => { // extra is likely unused here
                const result = await listAvailableRulesTool.execute();
                // Attempt to return as text JSON, based on error messages hinting available types
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
		);

		// Register getRuleContentTool
        const inputSchemaShape = getRuleContentTool.inputSchema instanceof z.ZodObject
            ? getRuleContentTool.inputSchema.shape
            : {};

		this.server.tool(
			getRuleContentTool.name,
            inputSchemaShape,
            // Callback function - use 'any' for args and extra due to type issues
            async (args: unknown /*, extra: any */) => { // extra is likely unused
                // Manual validation inside if args type is 'any'
                const parsedArgs = getRuleContentTool.inputSchema.safeParse(args);
                if (!parsedArgs.success) {
                    // Handle invalid input from SDK side
                    return { content: [{ type: 'text', text: `Invalid input: ${parsedArgs.error.message}`}], isError: true };
                }
                const result = await getRuleContentTool.execute(parsedArgs.data);
                // Return as text JSON
                return { content: [{ type: 'text', text: JSON.stringify(result) }] };
            }
		);
	}
}

// Define more specific types for Env and ExecutionContext if known for the environment
// Example for Cloudflare Workers:
// interface Env { /* ... bindings ... */ }
// interface ExecutionContext { waitUntil(promise: Promise<any>): void; passThroughOnException(): void; }

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
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
