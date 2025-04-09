import { Command } from 'commander';
import chalk from 'chalk';
import { startServer } from '../../server.js';

/**
 * Register the serve command with the CLI
 * @param program The Commander program instance
 */
export function registerServeCommand(program: Command) {
    program
        .command('serve')
        .description('Start the MCP server')
        .action(async (options) => {
            const { nodeUrl, verbose } = program.opts();
            try {
                if (verbose) {
                    console.log(chalk.blue(`Starting MCP server...`));
                    console.log(chalk.blue(`RPC URL: ${nodeUrl}`));
                }

                await startServer({ nodeUrl });

            } catch (error) {
                console.error(chalk.red('Failed to start MCP server:'), error);
                process.exit(1);
            }
        });
}
