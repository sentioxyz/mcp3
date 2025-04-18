#!/usr/bin/env node

import {Command} from 'commander';
import * as dotenv from 'dotenv';

import {Registration} from "../system.js";
import {registerStartCommand} from "./commands/start-command.js";
import {registerCommonTools} from "../tools/index.js";


export async function startCli(registration: Registration) {
    dotenv.config();

    let program = new Command()
    program.name(registration.name).description(registration.description).version(registration.version);

    // Global options
    program.option('-v, --verbose', 'Enable verbose output')

    program = registration.bindGlobalOptions(program);

    registerCommonTools(registration)

    let startCommand = program
        .command('start')
        .description('Start the MCP server')

    startCommand = registration.bindServerOptions(startCommand);
    registerStartCommand(startCommand, registration)

    registration.registerToolAsCommands(program);

    // Add other commands from subprojects
    registration.bindCommands(program);

    program.parse(process.argv);
}

// Call main function if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startCli(Registration.create("mcp3", "Model Context Protocol", "1.0.0")).catch(err => {
        console.error('Error in main:', err);
        process.exit(1);
    });
}
