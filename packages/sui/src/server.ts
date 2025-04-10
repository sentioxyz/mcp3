import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';
import { registerTools, registerProjects } from './tools/register.js';

// Load environment variables
dotenv.config();

// Start the server with stdio transport
async function startServer(options: { nodeUrl: string }) {
    console.error('Starting Sui MCP server...');

    const nodeUrl = options.nodeUrl as string;

    // Create an MCP server
    const server = new McpServer({
        name: 'Sui MCP',
        version: '1.0.0',
        description: 'Model Context Protocol server for Sui blockchain'
    });

    // Register all tools
    registerTools(server, nodeUrl);
    registerProjects(server, options);

    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Sui MCP server started on stdio');
}

export { startServer };
