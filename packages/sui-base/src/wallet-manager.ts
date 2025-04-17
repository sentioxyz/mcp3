import {IWalletManager} from '@mcp3/sui-wallets';

export {type IWalletManager} from "@mcp3/sui-wallets";


/**
 * Get a wallet manager instance if the sui-wallets package is available
 * @param options Options for the wallet manager
 * @returns A wallet manager instance or null if not available
 */
export async function getWalletManager(options: { nodeUrl: string, walletConfig?: string }): Promise<IWalletManager | null> {
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
