import { Command } from 'commander';
import chalk from 'chalk';
import {Registration} from "../../system.js";
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {  SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from "express";
import {Server} from "node:net";


export function registerServeCommand(
    command: Command, registration: Registration, registerToolCallback: (reg: Registration) => Promise<void> | void) {

  command.option('-p, --port <port>', 'Port to listen on', '3000');

  command.action(async (cmdOptions) => {
    const { port, verbose } = command.opts();
    try {
      if (verbose) {
        console.error(chalk.blue(`Starting MCP server ...`));
      }
      await registerToolCallback(registration);
      const server = new McpServer({
        name: 'MCP Server',
        version: '1.0.0',
        description: 'Model Context Protocol server',
      });

      const app = express();

      registration.bindServer(server, cmdOptions);

      let transport: SSEServerTransport | null = null;
      app.get("/sse", (req, res) => {
        transport = new SSEServerTransport("/messages", res);
        server.connect(transport);
      });

      app.post("/messages", (req, res) => {
        if (transport) {
          transport.handlePostMessage(req, res);
        }
      });
      app.listen(port, () => {
        console.error('Sui MCP server started through SSE on port ' + port);
        registration.afterServerStart(cmdOptions);
      });
    } catch (error) {
      console.error(chalk.red(`Failed to start MCP server: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });
}
