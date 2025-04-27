#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {addSuiGlobalOptions, register as RegisterBase} from "@mcp3/sui-base";
import {registerSubProjects} from "../register.js";

const registration = Registration.create("mcp3-sui", "Sui Model Context Protocol", "1.0.12" );

// Add global options from sui-base
addSuiGlobalOptions(registration);
RegisterBase(registration);

// Register sub-projects
registerSubProjects(registration).then(() => {
  startCli(registration).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
});
