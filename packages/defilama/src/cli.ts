#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerGlobalOptions} from "./index.js";
import {registerTools} from "./tools/index.js";

const registration = Registration.create("mcp3-sui-defilama", "DeFiLlama API Integration", "1.0.2");

// Register global options
registerGlobalOptions(registration);

startCli(registration, registerTools).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
});
