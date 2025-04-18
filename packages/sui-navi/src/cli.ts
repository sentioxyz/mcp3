#!/usr/bin/env node

import {Registration, startCli} from "@mcp3/common";
import {addSuiGlobalOptions} from "@mcp3/sui-base";
import {registerNaviTools} from "./tools/index.js";
import {registerNaviResource} from "./resources/navi-resource.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const registration = Registration.create("mcp3-sui-navi", "Sui Navi Protocol", "1.0.0");

  // Add global options from sui-base
  addSuiGlobalOptions(registration);

  // Register Navi tools and resources
  registerNaviTools(registration);
  registerNaviResource(registration);

  startCli(registration).catch(err => {
    console.error('Error in main:', err);
    process.exit(1);
  });
}
