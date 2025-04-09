import { Command } from 'commander';
import chalk from 'chalk';
import { serve } from "../../serve.js";

/**
 * Configure the 'start' command
 * @param program The Commander program instance
 */
export function configureStartCommand(program: Command): void {
    program
        .command('start')
        .description('Start the MCP server')
        .option('-s, --scope <scope>', 'Limit the scope MCP to a specific subproject', './contracts')
        .action(async (options, cmd) => {
            try {
                // Get base path from global options
                const basePath = cmd.parent.opts().basePath;

                console.log(chalk.blue(`Starting MCP server with scope: ${options.scope}...`));

                // Start the MCP server
                await serve(options.scope, basePath);

                console.log(chalk.green('MCP server started successfully'));
            } catch (error: any) {
                console.error(chalk.red(`Failed to start MCP server: ${error.message || error}`));
                process.exit(1);
            }
        });
}
