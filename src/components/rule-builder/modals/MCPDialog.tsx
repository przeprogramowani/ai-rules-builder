import React from 'react';
import {
  ConfirmDialog,
  ConfirmDialogHeader,
  ConfirmDialogContent,
  ConfirmDialogActions,
} from '../../ui/ConfirmDialog';

interface MCPDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MCPDialog: React.FC<MCPDialogProps> = ({ isOpen, onClose }) => {
  return (
    <ConfirmDialog isOpen={isOpen} onClose={onClose}>
      <ConfirmDialogHeader>MCP Instructions</ConfirmDialogHeader>
      <ConfirmDialogContent>
        <div className="space-y-4 text-sm text-gray-300">
          <div className="mb-4 p-3 bg-gray-800/50 rounded-md">
            <h3 className="text-md font-semibold text-gray-100 mb-1">Why use MCP Integration?</h3>
            <p>
              Integrating this Model Context Protocol (MCP) server with your AI assistant (like
              Cursor) allows it to dynamically access and utilize a curated list of coding rules and
              standards.
            </p>
            <p className="mt-1">Your AI assistant can use two main capabilities:</p>
            <ul className="list-disc list-inside ml-4 mt-1 space-y-0.5">
              <li>
                <code className="bg-gray-900 px-1 rounded text-xs">listAvailableRules</code>: To
                discover all available rule sets, their names, and technology stacks.
              </li>
              <li>
                <code className="bg-gray-900 px-1 rounded text-xs">getRuleContent</code>: To fetch
                the specific coding guidelines for a chosen rule set.
              </li>
            </ul>
            <p className="mt-2">
              This enables your assistant to provide more context-aware and standardized coding
              suggestions.
            </p>
          </div>

          <p>You can integrate with the 10x Rules MCP server in two ways:</p>

          <div>
            <h4 className="font-semibold text-gray-100 mb-1">
              1. Native SSE Support (e.g., Cursor)
            </h4>
            <p>Add the MCP server URL directly to your editor's configuration:</p>
            <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
              <code>
                {`{
  "mcpServers": {
    "10x-rules": {
      "url": "https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse"
    }
  }
}`}
              </code>
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-gray-100 mb-1">
              2. Integration via Proxy (e.g., Claude Desktop)
            </h4>
            <p>If your editor doesn't support SSE directly, use the mcp-remote proxy:</p>
            <ol className="list-decimal list-inside ml-4 space-y-1 mt-1">
              <li>
                Install the proxy:{' '}
                <code className="bg-gray-800 px-1 rounded">npm install -g mcp-remote</code>
              </li>
              <li>Configure your editor to use the proxy:</li>
            </ol>
            <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
              <code>
                {`{
  "mcpServers": {
    "10x-rules": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse"
      ]
    }
  }
}`}
              </code>
            </pre>
          </div>
          <p>
            After configuring, restart your editor. The <code>listAvailableRules</code> and{' '}
            <code>getRuleContent</code> tools should become available.
          </p>
          <p>
            Full documentation of the MCP server for 10xRules can be found{' '}
            <a
              href="https://github.com/przeprogramowani/ai-rules-builder/blob/master/mcp-server/README.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              here
            </a>
          </p>
        </div>
      </ConfirmDialogContent>
      <ConfirmDialogActions>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          Close
        </button>
      </ConfirmDialogActions>
    </ConfirmDialog>
  );
};

export default MCPDialog;
