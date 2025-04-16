#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerCetusTools} from "./tools/index.js";
import {registerCetusResource} from "./resources/cetus-resource.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const registration = new Registration("mcp3-sui-cetus", "Sui Cetus Protocol", "1.0.0");
  
  registration.addGlobalOption((command) => {
    command.option('-e, --node-url <nodeUrl>', 'Sui RPC Endpoint URL', process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443')
  });
  
  registerCetusTools(registration);
  registerCetusResource(registration);
  
  startCli(registration).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
