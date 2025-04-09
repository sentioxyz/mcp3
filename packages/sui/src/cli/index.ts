#!/usr/bin/env node

import { Command } from 'commander';
import * as dotenv from 'dotenv';

// Import command registrations
import { registerServeCommand } from './commands/serve-command.js';
import { registerGetAbiCommand } from './commands/get-abi-command.js';
import { registerViewCommand } from './commands/view-command.js';
import { registerQueryEventsCommand } from './commands/query-events-command.js';

const program = new Command();

program
  .name('sui-mcp')
  .description('CLI for Sui Model Context Protocol')
  .version('1.0.0');

// Global options
program
  .option('-n, --nodeUrl <nodeUrl>', 'Sui RPC URL', process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443')
  .option('-v, --verbose', 'Enable verbose output')

// Register all commands
registerServeCommand(program);
registerGetAbiCommand(program);
registerViewCommand(program);
registerQueryEventsCommand(program);

export async function main() {
  dotenv.config();

  // Parse command line arguments
  program.parse(process.argv);
}

// Call main function if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
