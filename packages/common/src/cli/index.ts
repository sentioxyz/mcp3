#!/usr/bin/env node

import {Command} from 'commander';
import * as dotenv from 'dotenv';

import {Registration} from "../system.js";
import {registerStartCommand} from "./commands/start-command.js";
import {registerCommonTools} from "../tools/index.js";
import {registerToolsAsSubcommands} from "./commands/tool-command.js";
import {registerServeCommand} from "./commands/serve-command.js";


export async function startCli(
    registration: Registration,
    registerToolsCallback: (reg: Registration) => Promise<void> | void
) {
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
    registerStartCommand(startCommand, registration, registerToolsCallback)

    // Register tools as subcommands of the 'tool' command
    registerToolsAsSubcommands(program, registration, registerToolsCallback);
    // Register serve command
    registerServeCommand(program, registration, registerToolsCallback);
    // Add other commands from subprojects
    registration.bindCommands(program);

    await program.parseAsync(process.argv);
}
