import { Command } from 'commander';
import chalk from 'chalk';
import {Registration} from "../../system.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';


export function registerStartCommand(
  command: Command,
  registration: Registration
) {

  command.action(async (cmdOptions) => {
    const { verbose } = command.opts();
    try {
      if (verbose) {
        console.error(chalk.blue(`Starting MCP server ...`));
      }
      const server = new McpServer({
        name: 'MCP Server',
        version: '1.0.0',
        description: 'Model Context Protocol server',
      });

      registration.bindServer(server, cmdOptions);
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('Sui MCP server started on stdio');
    } catch (error) {
      console.error(chalk.red(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
}
