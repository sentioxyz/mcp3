#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerWalletsTools, registerWalletsResource, registerGlobalOptions} from "./index.js";
import {register as registerTxServer} from '@mcp3/transaction-server'
import {addSuiGlobalOptions} from "@mcp3/sui-base";

if (import.meta.url === `file://${process.argv[1]}`) {
    const registration = Registration.create("mcp3-sui-wallets", "Sui Wallet Management", "1.0.0");

    // Register global options
    addSuiGlobalOptions(registration);
    registerGlobalOptions(registration);

    // Create a callback function to register tools
    const registerTools = async (reg: Registration) => {
        // Register tools and resources
        registerWalletsTools(reg);
        registerWalletsResource(reg);
        registerTxServer(reg);
    };

    // Register tools immediately for the main CLI
    registerTools(registration);

    startCli(registration, registerTools).catch(err => {
        console.error('Error in main:', err);
        process.exit(1);
    });

}