import { Command } from 'commander';
import { findConfigByAddress } from "../../config.js";
import path from "path";
import chalk from "chalk";
import { downloadABI } from "../../abi.js";
import fs from "fs";
import { getFunctionsFromContract, getProviderEndpoint, invokeEthCall } from "../../contract.js";
import { validateAddressFormat, errorAndExit } from '@mcp3/common';

/**
 * Configure the 'invoke' command
 * @param program The Commander program instance
 */
export function configureInvokeCommand(program: Command): void {
    program
        .command('invoke')
        .description('Invoke a function on a contract')
        .argument('<address>', 'Address of the contract')
        .argument('<function>', 'Function to invoke (with arguments if needed)')
        .option('-p, --provider <provider>', 'The provider endpoint to use')
        .option('-c, --chain <chain>', 'Chain ID', '1')
        .option('-k, --skip-download', 'Skip downloading the ABI if not found', false)
        .option('-b, --block <block>', 'Invoke the function at a specific block height (default: latest)', '0')
        .action(async (address, functionCall, options, cmd) => {
            try {
                // Get base path from global options
                const basePath = cmd.parent.opts().basePath;

                // Validate address format
                try {
                    validateAddressFormat(address);
                } catch (error: any) {
                    errorAndExit(`Invalid address: ${error.message || error}`);
                }

                // Find or download ABI
                const contractsDir = path.join(basePath, "contracts");
                const config = findConfigByAddress(address, contractsDir);
                let abi: any;

                if (!config) {
                    console.error(`Cannot find contract for address ${address}`);
                    if (options.skipDownload) {
                        errorAndExit('Contract not found and skip-download option is enabled');
                    } else {
                        console.log(chalk.gray(`Trying to download ABI for address ${address}...`));
                        const chain = options.chain;
                        const downloaded = await downloadABI(chain, address, contractsDir);
                        abi = downloaded.abi;
                    }
                } else {
                    const abiFile = path.join(path.dirname(config.configFile), 'abi.json');
                    const data = fs.readFileSync(abiFile, 'utf-8');
                    abi = JSON.parse(data);
                }

                // Check if function is specified
                if (!functionCall) {
                    console.error(chalk.red("No function specified"));
                    const fns = getFunctionsFromContract(abi);
                    console.log(chalk.blue("Available functions:"));
                    for (let fn of fns) {
                        console.log(`- ${fn.name}(${fn.inputs.map((i: any) => i.type).join(", ")})`);
                    }
                    process.exit(1);
                }

                // Invoke the function
                console.log(chalk.blue(`Invoking function ${functionCall} on contract ${address}...`));
                const blockNumber = parseInt(options.block);
                const ret = await invokeEthCall(
                    options.provider ?? getProviderEndpoint(options.chain),
                    address,
                    abi,
                    functionCall,
                    blockNumber
                );

                if (ret) {
                    console.log(chalk.green("Result:"));
                    console.log(ret);
                } else {
                    console.log(chalk.red("No result"));
                }
            } catch (error: any) {
                errorAndExit(`Failed to invoke function: ${error.message || error}`);
            }
        });
}
