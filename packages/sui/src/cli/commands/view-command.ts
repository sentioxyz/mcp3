import { Command } from 'commander';
import chalk from 'chalk';
import { callViewFunction } from '../../call.js';
import { parseFn } from '../utils.js';

/**
 * Register the view command with the CLI
 * @param program The Commander program instance
 */
export function registerViewCommand(program: Command) {
    program
        .command('call-view')
        .description('Call a view function for a given address')
        .argument('<package_module>', 'The module (eg. 0x2::foo:bar) to call the function for')
        .argument('<fn_and_params>', 'The name of the function and parameters to call (e.g., "function(arg1,arg2)" or "function<T0,T1>(arg1,arg2)")')
        .action(async (package_module, fn_and_params, options) => {
            const { nodeUrl, verbose } = program.opts();
            try {
                if (verbose) {
                    console.log(chalk.blue(`Calling function ${fn_and_params} on package ${package_module}`));
                    console.log(chalk.blue(`RPC URL: ${nodeUrl}`));
                }
                const [packageId, module] = package_module.split('::');
                const [functionName, params, typeArguments] = parseFn(fn_and_params)

                if (verbose && typeArguments.length > 0) {
                    console.log(chalk.blue(`Type arguments: ${typeArguments.join(', ')}`));
                }

                const result = await callViewFunction({
                    nodeUrl,
                    packageId,
                    module,
                    functionName,
                    params,
                    typeArguments
                });

                console.log(chalk.green('Function call successful:'));
                // Custom replacer function to handle BigInt values
                const replacer = (key: string, value: any) => {
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    return value;
                };
                console.log(JSON.stringify(result, replacer, 2));

            } catch (error) {
                console.error(chalk.red('Failed to call function:'), error);
                process.exit(1);
            }
        });
}
