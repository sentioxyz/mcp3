import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFetchJSONTool } from '@mcp3/common';
import { registerAbiTool } from './abi-tool.js';
import { registerViewFunctionTool } from './view-function-tool.js';
import { registerEventsTool } from './events-tool.js';

/**
 * Register all Sui MCP tools with the server
 * @param server The MCP server instance
 * @param nodeUrl The Sui RPC URL
 */
export function registerTools(server: McpServer, nodeUrl: string) {
    // Register individual tools
    registerAbiTool(server, nodeUrl);
    registerViewFunctionTool(server, nodeUrl);
    registerEventsTool(server, nodeUrl);

    // Register fetch-json tool from common package
    registerFetchJSONTool(server);
}
