import {Registration} from "@mcp3/common";

// Define a type for the WalletManager to avoid direct import dependency
interface WalletManagerLike {
    getDefaultWallet(): { address: string } | null;
    getWallet(addressOrName?: string, options?: { allowPartialMatch?: boolean, caseSensitive?: boolean }): { address: string } | null;
}

interface WalletManagerConstructor {
    new(options: { nodeUrl: string, walletConfig?: string }): WalletManagerLike;
}

/**
 * Get the default wallet address from the wallet manager if available
 * @param registration The Registration instance
 * @returns The wallet manager instance or null if not available
 */
export async function getDefaultWalletAddress(registration: Registration) {
    try {
        // Try to dynamically import the wallet manager
        // Use dynamic import with type assertion to avoid direct dependency
        const walletModule = await import('@mcp3/sui-wallets' as string);
        if (walletModule && typeof walletModule.WalletManager === 'function') {
            const WalletManager = walletModule.WalletManager as WalletManagerConstructor;
            return new WalletManager({
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
