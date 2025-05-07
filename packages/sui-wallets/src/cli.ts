#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {register as registerTxServer} from '@mcp3/transaction-server'
import {addSuiGlobalOptions} from "@mcp3/sui-base";
import {registerWalletsTools} from "./tools/index.js";
import {registerWalletsResource} from "./resources/wallets-resource.js";

const registration = Registration.create("mcp3-sui-wallets", "Sui Wallet Management", "1.0.0");

// Register global options
addSuiGlobalOptions(registration);

registration.addGlobalOption((command) => {
    command.option('-c, --wallet-config <walletConfig>', 'Path to wallet configuration file', process.env.SUI_WALLET_CONFIG_PATH);
});
startCli(registration, async (reg) => {
    // Register tools immediately for the main CLI
    registerTools(registration);
    registerTxServer(registration);
}).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
});

export function registerTools(registration: Registration) {
    registerWalletsTools(registration);
    registerWalletsResource(registration);
}