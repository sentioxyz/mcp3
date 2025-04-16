import {Registration} from "@mcp3/common";


export async function getDefaultWalletAddress(registration: Registration) {
    try {
        // Try to dynamically import the wallet manager
        const walletModule = await import('@mcp3/sui-wallets');
        if (walletModule && walletModule.WalletManager) {
            return new walletModule.WalletManager({
                nodeUrl: registration.globalOptions.nodeUrl,
                walletConfig: registration.globalOptions.walletConfig
            });
        }
    } catch (error) {
        // Silently fail if the module is not available
        // console.error('Error loading wallet manager:', error);
    }
    return null;
}