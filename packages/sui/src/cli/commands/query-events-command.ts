import { Command } from 'commander';
import chalk from 'chalk';
import { parseEventFilter, queryEvents } from '../../events.js';
import { formatAddress } from '../utils.js';

/**
 * Register the query-events command with the CLI
 * @param program The Commander program instance
 */
export function registerQueryEventsCommand(program: Command) {
    program
        .command('query-events')
        .description('Query events from Sui RPC')
        .argument('<filter>', 'Filter in one of formats:\n\t1. "txId" (e.g., 0x123...)\n\t2. "package::module::type" (e.g., 0x2::coin::CoinEvent)\n\t')
        .option('-c, --cursor <cursor>', 'Pagination cursor (JSON string)')
        .option('-l, --limit <limit>', 'Maximum number of events to return', '50')
        .option('-d, --descending', 'Sort events in descending order', false)
        .option('-j, --json', 'Output in JSON format', false)
        .action(async (filterStr, options) => {
            const { nodeUrl, verbose } = program.opts();
            try {
                if (verbose) {
                    console.log(chalk.blue(`Querying events with filter: ${filterStr}`));
                    console.log(chalk.blue(`RPC URL: ${nodeUrl}`));
                }

                const filter = parseEventFilter(filterStr);
                const result = await queryEvents({
                    nodeUrl: nodeUrl,
                    filter,
                    cursor: options.cursor,
                    limit: parseInt(options.limit),
                    descending: options.descending,
                });

                if (options.json) {
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log(chalk.green(`Found ${result.data.length} events:`));

                    for (const event of result.data) {
                        console.log('\n' + chalk.yellow('─'.repeat(80)));
                        console.log(`${chalk.cyan('Transaction')}: ${event.id.txDigest}`);
                        console.log(`${chalk.cyan('Event Sequence')}: ${event.id.eventSeq}`);
                        console.log(`${chalk.cyan('Package')}: ${formatAddress(event.packageId, false)}`);
                        console.log(`${chalk.cyan('Module')}: ${event.transactionModule}`);
                        console.log(`${chalk.cyan('Sender')}: ${formatAddress(event.sender, false)}`);
                        console.log(`${chalk.cyan('Type')}: ${event.type}`);
                        console.log(`${chalk.cyan('Timestamp')}: ${event.timestampMs ? new Date(parseInt(event.timestampMs)).toISOString() : 'N/A'}`);
                        console.log(`${chalk.cyan('Data')}:`);
                        console.log(JSON.stringify(event.parsedJson, null, 2));
                    }

                    if (result.hasNextPage) {
                        console.log('\n' + chalk.blue('─'.repeat(80)));
                        console.log(chalk.blue('More events available. Use the following cursor to get the next page:'));
                        console.log(JSON.stringify(result.nextCursor));
                    }
                }
            } catch (error) {
                console.error(chalk.red('Failed to query events:'), error);
                process.exit(1);
            }
        });
}
