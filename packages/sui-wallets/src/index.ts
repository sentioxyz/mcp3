import {Registration} from '@mcp3/common';
import {registerWalletsTools} from './tools/index.js';
import {registerWalletsResource} from './resources/wallets-resource.js';


export {registerWalletsResource} from './resources/wallets-resource.js';

/**
 * Register Sui Wallets global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option('-c, --wallet-config <walletConfig>', 'Path to wallet configuration file', process.env.SUI_WALLET_CONFIG_PATH);
    });
}

/**
 * Register Sui Wallets tools and resources with the Registration
 * @param registration The Registration instance
 */
export function registerTools(registration: Registration) {
    registerWalletsTools(registration);
    registerWalletsResource(registration);
}

