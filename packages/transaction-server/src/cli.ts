#!/usr/bin/env node

import { Command } from 'commander';
import { startTransactionServer, stopTransactionServer } from './server.js';
import { ServerConfig, DEFAULT_CONFIG } from './config.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a new command
const program = new Command();

// Set up the program
program
  .name('transaction-server')
  .description('Transaction server for handling transactions and serving transaction UI')
  .version('1.0.0');

// Add start command
program
  .command('start')
  .description('Start the transaction server')
  .option('-a, --address <address>', 'Address to listen on', DEFAULT_CONFIG.address)
  .option('-p, --port <port>', 'Port to listen on', String(DEFAULT_CONFIG.port))
  .action(async (options) => {
    const config: ServerConfig = {
      enabled: !options.disable,
      address: options.address,
      port: parseInt(options.port, 10)
    };

    try {
      await startTransactionServer(config);
    } catch (error) {
      console.error('Error starting transaction server:', error);
      process.exit(1);
    }
  });

// Function to run the CLI
function runCli(argv = process.argv) {
  // Parse command line arguments
  program.parse(argv);

  // If no command is provided, show help
  if (argv.length <= 2) {
    program.outputHelp();
  }
}

runCli();

// Export the program for programmatic usage
export default program;
