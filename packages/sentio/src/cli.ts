#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {registerTools, registerGlobalOptions} from "./index.js";

const registration = Registration.create("mcp3-sentio", "Sentio API Integration", "1.0.0");

// Register global options
registerGlobalOptions(registration);

startCli(registration, registerTools).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
});
