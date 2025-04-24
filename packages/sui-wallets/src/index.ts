import {Registration} from '@mcp3/common';
import {registerWalletsTools} from './tools/index.js';
import {registerWalletsResource} from './resources/wallets-resource.js';

// Export wallet manager and persistence from manager directory
export * from './manager/index.js';


export {registerWalletsResource} from './resources/wallets-resource.js';

export {registerWalletsTools} from './tools/index.js';


export function register(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option('-c, --wallet-config <walletConfig>', 'Path to wallet configuration file', process.env.SUI_WALLET_CONFIG_PATH);
    });


    registerWalletsTools(registration);
    registerWalletsResource(registration);
}
