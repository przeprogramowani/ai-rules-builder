# remote-mcp-server-authless

## 1. Project Description

This is an auth-less Model Context Protocol (MCP) server designed to run on Cloudflare Workers. It provides MCP tools that allow AI assistants or other clients to discover and retrieve AI coding rules defined within the server. The rules are loaded from a `preparedRules.json` file.

This server acts as a backend component, enabling integrations that require dynamic access to specific coding guidelines or standards.

## 2. Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Core Dependencies**:
    - `@modelcontextprotocol/sdk`: For implementing MCP server logic.
    - `zod`: For data validation (tool inputs/outputs).
    - `agents`: (Usage details depend on implementation in `src/index.ts`)
- **Development & Deployment**:
    - `wrangler`: Cloudflare's CLI for developing and deploying Workers.
- **Linting & Formatting**:
    - `biome`: Used for code formatting and linting.

## 3. Getting Started Locally

### Prerequisites

- Node.js (Check `.nvmrc` or project specifics for version)
- npm (or yarn, pnpm)
- Wrangler CLI: `npm install -g wrangler`

### Setup & Running

1.  **Clone the repository** (if you haven't already).
2.  **Generate the rules json summary**:
    ```bash
    npm run generate-rules
    ```
3.  **Navigate to the server directory**:
    ```bash
    cd mcp-server
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    or
    ```bash
    npm start
    ```
    The server will typically be available at `http://localhost:8787`. The MCP endpoint is usually `/sse` (e.g., `http://localhost:8787/sse`).

## 4. Available Scripts

The following scripts are available via `npm run <script_name>`:

-   `dev`: Starts the server locally using Wrangler for development, with live reloading.
-   `start`: An alias for `dev`.
-   `deploy`: Deploys the server to your configured Cloudflare Workers environment using Wrangler.
-   `format`: Formats the codebase using Biome.
-   `lint:fix`: Lints the code using Biome and attempts to automatically fix issues.
-   `cf-typegen`: Generates TypeScript types for Cloudflare environment bindings (like KV namespaces, Durable Objects, etc., if configured).

## 5. Project Scope & Functionality

-   **MCP Implementation**: Adheres to the Model Context Protocol standard.
-   **Cloudflare Worker**: Designed to be deployed and run efficiently on the Cloudflare edge network.
-   **Auth-less**: Does not implement user authentication for accessing tools.
-   **Rule Management Tools**: Provides the following MCP tools (defined in `src/tools/rulesTools.ts`):
    -   `listAvailableRules`: Returns a list of available rule libraries/sets, including their identifiers, names, and hierarchical stack (category). Reads data from `preparedRules.json` via `src/data/rulesProvider.ts`.
    -   `getRuleContent`: Takes a library identifier and returns the specific set of rules associated with it. Reads data from `preparedRules.json` via `src/data/rulesProvider.ts`.
-   **(Potential) Tool Customization**: The original template README mentioned customizing tools in `src/index.ts`. Refer to that file for details on adding or modifying tools.

## 6. Using the MCP Server

### Production Usage (Recommended)

This is the primary way to use the MCP server's capabilities within your AI-assisted development workflow.

**Endpoint:** `https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse`

**Connecting Your Editor:**

How you connect depends on your specific editor or AI assistant client:

-   **Editors with Native SSE Support (e.g., Cursor):** Some editors, like Cursor, can connect directly to an SSE endpoint. In Cursor's case, you can typically add the MCP server URL (`https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse`) directly in its configuration for AI context providers.
  ```json
        {
          "mcpServers": {
            "10x-rules": {
              "url": "https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse"
            }
          }
        }
        ```

-   **Editors Requiring a Proxy (e.g., Claude Desktop):** Other editors, like Claude Desktop, may not handle SSE directly and require a proxy like `mcp-remote`. For these:
    1.  Install the proxy: `npm install -g mcp-remote`.
    2.  Configure the editor to use the proxy, pointing it to the production URL. Example for Claude Desktop (`Settings > Developer > Edit Config`):
        ```json
        {
          "mcpServers": {
            "10x-rules": { // Descriptive name
              "command": "npx",
              "args": [
                "mcp-remote",
                "https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse"
              ]
            }
          }
        }
        ```

-   **Other Editors (Windsurf, GitHub Copilot, JetBrains AI Assistant, etc.):** Check the specific editor's documentation to see if it supports direct SSE connections for MCP. If direct connection is not supported or is unclear, using the `mcp-remote` proxy is the recommended approach.

After configuring, restart your editor. The `listAvailableRules` and `getRuleContent` tools should become available.

### Local Development & Testing

This setup is useful for developing or modifying the MCP server itself.

**Endpoint:** `http://localhost:8787/sse` (available after running `npm run dev` in the `mcp-server` directory, see Section 3).

**Connecting Clients:**

-   **Editors:** Follow the steps outlined in the "Production Usage" section, but substitute the local URL (`http://localhost:8787/sse`) whether connecting directly (like Cursor) or via the `mcp-remote` proxy.

**Testing:**

Use the **MCP Inspector** pointed at the local URL (`http://localhost:8787/sse`) to debug tool calls during development.

## 7. Deployment

This project uses GitHub Actions for CI/CD, defined in `.github/workflows/test-deploy.yml`. The workflow handles:

1.  **Linting:** Checks the code style of the main application (`npm run lint:check`).
2.  **Unit Testing:** Runs unit tests for the main application (`npm run test`).
3.  **Building Astro:** Builds the frontend Astro application (`npm run build`).
4.  **Deploying Astro App:** Deploys the built Astro frontend to Cloudflare Pages (`cloudflare/wrangler-action`).
5.  **Generating Rules:** Creates the `preparedRules.json` file needed by the MCP server (`npm run generate-rules`).
6.  **Installing Worker Dependencies:** Installs dependencies specifically for the MCP server (`cd mcp-server && npm ci`).
7.  **Deploying Worker:** Deploys the `mcp-server` as a Cloudflare Worker using Wrangler (`cd mcp-server && npx wrangler deploy`).

Deployment is triggered automatically on pushes to the `mcp-server` branch. Necessary Cloudflare secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) must be configured in the GitHub repository settings.

## 8. Planned Features

The following features are planned for future development:

-   **Create Cursor Rule Tool:** An MCP tool that allows creating or modifying a Cursor AI rule file directly within the user's host workspace.
-   **Propose Rule via PR Tool:** An MCP tool enabling users to select a rule or modification from their host environment and automatically create a Pull Request in the main repository to propose adding/updating it.

## 9. Project Status

-   **Version**: `0.0.0` (as per `package.json`)
-   **Status**: Assumed to be under active development.

## 10. License

The license for this project is not specified in the `