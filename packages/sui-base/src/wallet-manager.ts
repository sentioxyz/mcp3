import {IWalletManager} from '@mcp3/sui-wallets';
import {Registration} from "@mcp3/common";

export {type IWalletManager} from "@mcp3/sui-wallets";


/**
 * Get a wallet manager instance if the sui-wallets package is available
 * @param options Options for the wallet manager
 * @returns A wallet manager instance or null if not available
 */
export async function getWalletManager(options: {
    nodeUrl: string,
    walletConfig?: string
}): Promise<IWalletManager | null> {
    try {
        // Try to dynamically import the wallet manager
        const walletModule = await import('@mcp3/sui-wallets' as string);
        if (walletModule && typeof walletModule.WalletManager === 'function') {
            const WalletManager = walletModule.WalletManager;
            return new WalletManager(options) as IWalletManager;
        }
    } catch (error) {
        // Silently fail if the module is not available
        console.error('Error loading wallet manager:', error);
    }
    return null;
}

/**
 * Resolve a wallet address from a wallet manager
 * @param walletManager The wallet manager instance
 * @param walletAddress Optional wallet address or name to use (uses default if not provided)
 * @returns The resolved wallet address or empty string if not found
 */
export function resolveWalletAddress(walletManager: IWalletManager | null, walletAddress?: string): string {
    if (!walletManager) {
        return walletAddress || '';
    }

    if (walletAddress) {
        return walletManager.getWallet(walletAddress)?.address ?? walletAddress;
    } else {
        return walletManager.getDefaultWallet()?.address ?? '';
    }
}

/**
 * Get a wallet address from a wallet manager with error handling
 * @param walletManager The wallet manager instance
 * @param walletAddress Optional wallet address or name to use (uses default if not provided)
 * @returns The resolved wallet address
 * @throws Error if no wallet address could be resolved
 */
export async function resolveWalletAddressOrThrow(walletAddress?: string): Promise<string> {
    const {nodeUrl, walletConfig} = Registration.getInstance().globalOptions;
    const walletManager = await getWalletManager({
        nodeUrl,
        walletConfig
    });
    const addr = resolveWalletAddress(walletManager, walletAddress);

    if (!addr) {
        throw new Error('No wallet address provided and no default wallet address configured.');
    }

    return addr;
}
