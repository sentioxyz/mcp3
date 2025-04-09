#!/usr/bin/env node

import { Command } from 'commander';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { configureAddCommand } from './commands/add-command.js';
import { configureStartCommand } from './commands/start-command.js';
import { configureInvokeCommand } from './commands/invoke-command.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basePath = dirname(__dirname);

/**
 * Main function to set up and run the CLI
 */
export async function main() {
  // Create the base command
  const program = new Command();

  program
      .name("eth-mcp")
      .description("Ethereum Model Context Protocol CLI")
      .version("1.0.0");


  // Global options
  program.option('-p, --base-path <path>', 'Base path for the CLI', basePath);

  // Configure commands
  configureAddCommand(program);
  configureStartCommand(program);
  configureInvokeCommand(program);

  // If no command is provided, default to 'start'
  if (process.argv.length <= 2) {
    process.argv.push('start');
  }

  // Parse command line arguments
  await program.parseAsync(process.argv);
}

// Run the CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
