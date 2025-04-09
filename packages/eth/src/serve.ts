import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import chalk from "chalk";
import { registerTools } from "./tools/register.js";

let running = false;

/**
 * Start the MCP server
 * @param scope The scope for the MCP server
 * @param basePath The base path for the CLI
 */
export async function serve(scope: string, basePath: string) {
    if (running) {
        return
    }
    console.error(chalk.gray("The base path is ", basePath))

    // Create an MCP server
    const server = new McpServer({
        name: "Ethereum MCP",
        version: "1.0.0",
        description: "Model Context Protocol server for Ethereum blockchain"
    });

    // Register all tools
    registerTools(server, basePath, scope);

    running = true
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(chalk.green("MCP Server running on stdio"));
}