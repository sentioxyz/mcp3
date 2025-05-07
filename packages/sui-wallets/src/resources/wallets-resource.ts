import {Registration} from '@mcp3/common';
import {WalletManager} from "../manager/wallet-manager.js";
import {toWalletResource} from "../tools/wallet-management-tools.js";

/**
 * Register the wallets resource with the Registration
 * @param registration The Registration instance
 */
export function registerWalletsResource(registration: Registration) {
    const walletManager = new WalletManager({
        nodeUrl: registration.globalOptions?.nodeUrl,
        walletConfig: registration.globalOptions?.walletConfig
    });
    walletManager.getAllWallets().forEach(wallet => {
        const resource = toWalletResource(wallet);
        registration.addResource({
            name:"wallet: " + wallet.name,
            uri: `sui:///wallet/${wallet.address}`,
            callback: async (uri) => {
                return {
                    contents: [resource.resource]
                }
            }
        })
    })
}
