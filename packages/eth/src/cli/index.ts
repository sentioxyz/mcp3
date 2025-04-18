#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerEthTools} from "../tools/index.js";
import {dirname} from 'path';
import {fileURLToPath} from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const basePath = dirname(__dirname);

// Export the main function for backwards compatibility
export async function main() {
  const registration = Registration.create("mcp3-eth", "Ethereum Model Context Protocol", "1.0.0");
  registration.addGlobalOption((command) => {
    command.option('-p, --base-path <path>', 'Base path for the CLI', basePath);
    command.option('-s, --scope <scope>', 'Limit the scope MCP to a specific subproject', './contracts');
  });
  registerEthTools(registration);
  await startCli(registration);
}

// Run the CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
