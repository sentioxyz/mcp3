#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerSUITools} from "../tools/index.js";
import {registerSUIResources} from "../resources/index.js";
import {registerSubProjects} from "../index.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const registration = new Registration("mcp3-sui", "Sui Model Context Protocol", "1.0.0" );
  registration.addGlobalOption((command) => {
    command.option('-e, --node-url <nodeUrl>', 'Sui RPC Endpoint URL', process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443')
    command.option('-w, --wallet-address <walletAddress>', 'Sui wallet address', process.env.SUI_WALLET_ADDRESS)
  })
  registerSUITools(registration);
  registerSUIResources(registration);
  registerSubProjects(registration).then(() => {
    startCli(registration).catch(err => {
      console.error('Error in main:', err);
      process.exit(1);
    });
  });
}