#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {addSuiGlobalOptions} from "@mcp3/sui-base";
import {registerCetusTools} from "./tools/index.js";
import {registerCetusResource} from "./resources/cetus-resource.js";

const registration = Registration.create("mcp3-sui-cetus", "Sui Cetus Protocol", "1.0.0");

// Add global options from sui-base
addSuiGlobalOptions(registration);

// Create a callback function to register tools
const registerTools = async (reg: Registration) => {
    // Register Cetus tools and resources
    registerCetusTools(reg);
    registerCetusResource(reg);
};


startCli(registration, registerTools).catch(err => {
  console.error('Error in main:', err);
  process.exit(1);
});
