import { Command } from 'commander';
import { AptosChainId, ChainId, EthChainInfo, ExplorerApiType, getChainName, SuiChainId } from '@sentio/chain';
import { downloadABI } from '../../abi.js';
import chalk from "chalk";
import { downloadCodes } from "../../download-code.js";
import path from "path";
import { writeConfig, YamlConfig } from "../../config.js";
import { validateAddressFormat, errorAndExit } from '@mcp3/common';

// Initialize supported chains
const supportedChains: string[] = [
    AptosChainId.APTOS_MAINNET,
    AptosChainId.APTOS_TESTNET,
    AptosChainId.APTOS_MOVEMENT_TESTNET,
    AptosChainId.APTOS_MOVEMENT_MAINNET,
    SuiChainId.SUI_TESTNET,
    SuiChainId.SUI_MAINNET
];

// Add Ethereum chains
for (const chain of Object.values(EthChainInfo)) {
    if (chain.explorerApiType === ExplorerApiType.ETHERSCAN || chain.explorerApiType === ExplorerApiType.BLOCKSCOUT) {
        supportedChains.push(chain.chainId);
    }
}

// Format supported chains for display
const supportedChainsMessage = supportedChains
    .map(chainId => `  ${chainId} (${getChainName(chainId)})`)
    .join('\n');

/**
 * Configure the 'add' command
 * @param program The Commander program instance
 */
export function configureAddCommand(program: Command): void {
    program
        .command('add')
        .description("Add a contract's ABI to the project")
        .argument('<address>', 'Address of the contract')
        .option('-n, --name <n>', 'File name for the downloaded contract, if empty, use address as file name')
        .option('-c, --chain <chain>', 'Chain ID', '1')
        .option('-f, --folder <folder>', 'Folder to save the contract', 'contracts')
        .action(async (address, options, cmd) => {
            try {
                // Get base path from global options
                const basePath = cmd.parent.opts().basePath;

                // Validate address format
                try {
                    validateAddressFormat(address);
                } catch (error: any) {
                    errorAndExit(`Invalid address: ${error.message || error}`);
                }

                // Process options
                const chain = options.chain.toLowerCase() as ChainId;
                const folder = path.join(basePath, options.folder);

                console.log(chalk.blue(`Adding contract ${address} from chain ${chain} (${getChainName(chain)})...`));

                // Download ABI and source code
                const { file: abiFilePath, name } = await downloadABI(chain, address, folder, options.name);
                const baseDir = path.dirname(abiFilePath);
                await downloadCodes(baseDir, chain, address);

                // Create and save config
                const config: YamlConfig = {
                    address,
                    chain,
                    name
                };
                writeConfig(config, path.join(baseDir, 'config.yaml'));

                console.log(chalk.green(`Successfully added contract ${address}`));
            } catch (error: any) {
                errorAndExit(`Failed to add contract: ${error.message || error}`);
            }
        });
}
