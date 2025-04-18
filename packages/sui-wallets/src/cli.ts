#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerWalletsTools} from "./tools/index.js";
import {registerWalletsResource} from "./resources/wallets-resource.js";

if (import.meta.url === `file://${process.argv[1]}`) {
    const registration = Registration.create("mcp3-sui-wallets", "Sui Wallet Management", "1.0.0");

    registration.addGlobalOption((command) => {
        command.option('-e, --node-url <nodeUrl>', 'Sui RPC Endpoint URL', process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443');
        command.option('-c, --wallet-config <walletConfig>', 'Path to wallet configuration file', process.env.SUI_WALLET_CONFIG_PATH);
    });

    registerWalletsTools(registration);
    registerWalletsResource(registration);

    startCli(registration).catch(err => {
        console.error('Error in main:', err);
        process.exit(1);
    });

}