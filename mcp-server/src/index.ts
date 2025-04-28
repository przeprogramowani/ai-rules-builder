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
