import { WalletConfig, WalletInfo } from '../wallet-manager.js';

/**
 * Interface for wallet persistence operations
 */
export interface WalletPersistence {
  /**
   * Load wallets from the persistence store
   * @returns A wallet configuration object
   */
  loadWallets(): WalletConfig;

  /**
   * Save wallets to the persistence store
   * @param wallets Array of wallet info objects
   * @param defaultWallet The default wallet address or name
   * @returns True if successful, false otherwise
   */
  saveWallets(wallets: WalletInfo[], defaultWallet: string | null): boolean;

  /**
   * Check if the persistence store exists
   * @returns True if the store exists, false otherwise
   */
  exists(): boolean;

  /**
   * Check if the persistence store is read-only
   * @returns True if read-only, false if writable
   */
  isReadOnly(): boolean;
}
