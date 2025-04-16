import { WalletConfig, WalletInfo } from '../wallet-manager.js';
import { WalletPersistence } from './wallet-persistence.js';

/**
 * Implementation of wallet persistence using environment variables
 */
export class EnvVarWalletPersistence implements WalletPersistence {
  // Environment variable names
  private static readonly ADDRESSES_VAR = 'SUI_WALLET_ADDRESSES';
  private static readonly NAMES_VAR = 'SUI_WALLET_NAMES';
  private static readonly PRIVATE_KEYS_VAR = 'SUI_WALLET_PRIVATE_KEYS';
  private static readonly MNEMONICS_VAR = 'SUI_WALLET_MNEMONICS';
  private static readonly DEFAULT_WALLET_VAR = 'SUI_DEFAULT_WALLET';

  /**
   * Load wallets from environment variables
   * @returns A wallet configuration object
   */
  public loadWallets(): WalletConfig {
    // Get environment variables
    const addresses = this.getEnvArray(EnvVarWalletPersistence.ADDRESSES_VAR);
    const names = this.getEnvArray(EnvVarWalletPersistence.NAMES_VAR);
    const privateKeys = this.getEnvArray(EnvVarWalletPersistence.PRIVATE_KEYS_VAR);
    const mnemonics = this.getEnvArray(EnvVarWalletPersistence.MNEMONICS_VAR);
    const defaultWallet = process.env[EnvVarWalletPersistence.DEFAULT_WALLET_VAR] || undefined;

    // Create wallet config
    const wallets = addresses.map((address, index) => {
      return {
        address,
        name: names[index] || undefined,
        privateKey: privateKeys[index] || undefined,
        mnemonic: mnemonics[index] || undefined
      };
    });

    return {
      wallets,
      defaultWallet
    };
  }

  /**
   * Save wallets to environment variables (not supported)
   * @returns Always false as environment variables are read-only
   */
  public saveWallets(_wallets: WalletInfo[], _defaultWallet: string | null): boolean {
    // Environment variables are read-only in this implementation
    return false;
  }

  /**
   * Check if wallet environment variables exist
   * @returns True if at least the addresses variable exists
   */
  public exists(): boolean {
    return !!process.env[EnvVarWalletPersistence.ADDRESSES_VAR];
  }

  /**
   * Check if the persistence store is read-only
   * @returns Always true as environment variables are read-only
   */
  public isReadOnly(): boolean {
    return true;
  }

  /**
   * Get an array from an environment variable
   * @param varName The environment variable name
   * @returns Array of values (empty if not found)
   */
  private getEnvArray(varName: string): string[] {
    const value = process.env[varName];
    if (!value) {
      return [];
    }

    // Split by comma and trim each value
    return value.split(',').map(item => item.trim());
  }
}
