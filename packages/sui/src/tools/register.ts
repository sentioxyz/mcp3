import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFetchTool } from '@mcp3/common';
import { registerAbiTool } from './abi-tool.js';
import { registerViewFunctionTool } from './view-function-tool.js';
import { registerEventsTool } from './events-tool.js';
import { register as registerNavi } from '../projects/navi/index.js';

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

    // Register fetch tool from common package
    registerFetchTool(server);
}

/**
 * Register all Sui MCP projects with the server
 * @param server The MCP server instance
 * @param options Options for project registration
 */
export function registerProjects(server: McpServer, options: any) {
    // Register individual projects
    registerNavi(server, options);
}
