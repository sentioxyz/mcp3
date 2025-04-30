#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerEthTools, registerGlobalOptions} from "../index.js";
import 'dotenv/config';

// Export the main function for backwards compatibility
export async function main() {
  const registration = Registration.create("mcp3-eth", "Ethereum Model Context Protocol", "1.0.0");
  registerGlobalOptions(registration);
  await startCli(registration, registerEthTools);
}

// Run the CLI
main().catch(err => {
  console.error('Error in main:', err);
  process.exit(1);
});
