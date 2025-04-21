#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerTools} from "./tools/index.js";

if (import.meta.url === `file://${process.argv[1]}`) {
    const registration = Registration.create("mcp3-sui-defilama", "DeFiLlama API Integration", "1.0.0");

    registration.addGlobalOption((command) => {
        command.option("--defilama-endpoint <endpoint>", "DeFiLlama API endpoint", "https://api.llama.fi");
    });
    // Register DeFiLlama tools
    registerTools(registration);

    startCli(registration).catch(err => {
        console.error('Error in main:', err);
        process.exit(1);
    });
}
