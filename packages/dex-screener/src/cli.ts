#!/usr/bin/env node

import { Registration, startCli } from "@mcp3/common";
import { registerTools } from "./tools/index.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const registration = Registration.create("mcp3-dex-screener", "DexScreener API Integration", "1.0.0");

  registration.addGlobalOption((command) => {
    command.option("--dexscreener-endpoint <endpoint>", "DexScreener API endpoint", "https://api.dexscreener.com");
  });
  
  // Register DexScreener tools
  registerTools(registration);

  startCli(registration).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
