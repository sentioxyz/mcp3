#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {addSuiGlobalOptions, register} from "@mcp3/sui-base";
import {registerSubProjects} from "../index.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const registration = new Registration("mcp3-sui", "Sui Model Context Protocol", "1.0.0" );

  // Add global options from sui-base
  addSuiGlobalOptions(registration);

  register(registration);

  // Register sub-projects
  registerSubProjects(registration).then(() => {
    startCli(registration).catch(err => {
      console.error('Error in main:', err);
      process.exit(1);
    });
  });
}