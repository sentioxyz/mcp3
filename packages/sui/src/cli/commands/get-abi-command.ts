import { Command } from 'commander';
import chalk from 'chalk';
import { downloadABI } from '../../abi.js';
import { SuiMoveNormalizedType } from '@mysten/sui.js/client';
import { formatSuiType, formatTypeArgument, formatAddress } from '../utils.js';

/**
 * Register the get-abi command with the CLI
 * @param program The Commander program instance
 */
export function registerGetAbiCommand(program: Command) {
    program
        .command('get-abi')
        .description('Get the ABI for a given object id')
        .argument('<object_id>', 'The object id to get the ABI for')
        .option('-j, --json', 'Output in JSON format', false)
        .option('-l, --long-address', 'Display full addresses instead of shortened versions', false)
        .option('-p, --public-only', 'Only show public functions', true)
        .option('-r, --read-only', 'Only show read-only non-void functions', false)
        .action(async (objectId, options) => {
            try {
                if (program.opts().verbose) {
                    console.log(chalk.blue(`Getting ABI for object ${objectId}`));
                    console.log(chalk.blue(`RPC URL: ${program.opts().nodeUrl}`));
                }
                const abi = await downloadABI(program.opts().nodeUrl, objectId);
                const readOnly = options.readOnly;
                const publicOnly = options.publicOnly;
                const longAddress = options.longAddress;
                if (program.opts().json) {
                    console.log(JSON.stringify(abi, null, 2));
                } else {
                    for (const [moduleName, module] of Object.entries(abi)) {
                        console.log(`module ${chalk.yellowBright(moduleName)} {`)
                        if (module.structs) {
                            for (const [structName, struct] of Object.entries(module.structs)) {
                                const abilities = struct.abilities.abilities.join(', ');
                                const fields = struct.fields
                                    .map(f => `\t\t${f.name}: ${formatSuiType(f.type, options.longAddress)}`)
                                    .join(',\n');
                                console.log(`\n\t${chalk.green('public')} ${chalk.yellow('struct')} ${chalk.yellowBright(structName)} ${chalk.green('has')} ${chalk.cyan(abilities)} {`);
                                console.log(fields);
                                console.log('\t}');
                            }
                        }

                        if (module.exposedFunctions) {
                            // Group functions by visibility
                            const groupedFunctions = Object.entries(module.exposedFunctions).reduce((acc, [funcName, func]) => {
                                // Skip functions based on readOnly flag
                                if (readOnly) {
                                    // Skip if any parameter is mutable reference
                                    const hasMutableRef = func.parameters.some(p =>
                                        typeof p === 'object' && 'MutableReference' in p
                                    );

                                    // Skip if return type is empty (void)
                                    const isVoid = func.return.length === 0;

                                    if (hasMutableRef || isVoid) {
                                        return acc;
                                    }
                                }

                                const visibility = func.visibility;
                                if (publicOnly && visibility !== 'Public') {
                                    return acc;
                                }
                                if (!acc[visibility]) {
                                    acc[visibility] = [];
                                }
                                acc[visibility].push({ name: funcName, func });
                                return acc;
                            }, {} as Record<string, Array<{ name: string; func: any }>>);

                            if (Object.keys(groupedFunctions).length === 0) {
                                continue;
                            }

                            // Print functions grouped by visibility
                            for (const [visibility, functions] of Object.entries(groupedFunctions)) {

                                console.log(chalk.gray(`\n ${visibility?.toLowerCase()} ${readOnly ? 'read-only ' : ''}functions:`));

                                for (const { name, func } of functions) {
                                    const returns = func.return.map((p: SuiMoveNormalizedType) => formatSuiType(p, longAddress)).join(', ') || chalk.gray('void');
                                    const formattedParams = func.parameters.map((p: SuiMoveNormalizedType) => formatSuiType(p, longAddress)).join(', ');

                                    // Format type parameters if they exist
                                    let typeParamsStr = '';
                                    if (func.typeParameters && func.typeParameters.length > 0) {
                                        const typeParams = func.typeParameters.map((tp: any, index: number) =>
                                            formatTypeArgument(tp, index)
                                        ).join(', ');
                                        typeParamsStr = chalk.gray(`<${typeParams}>`);
                                    }

                                    console.log(`\t${chalk.cyan(name)}${typeParamsStr}(${formattedParams}): ${returns}`);
                                }
                            }
                        }
                        console.log('}\n')
                    }
                }
            } catch (error) {
                console.error(chalk.red('Failed to get ABI:'), error);
                process.exit(1);
            }
        });
}
