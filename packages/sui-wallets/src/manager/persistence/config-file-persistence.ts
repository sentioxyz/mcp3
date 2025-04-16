import fs from 'fs';
import path from 'path';
import os from 'os';
import yaml from 'yaml';
import {WalletConfig, WalletInfo} from '../wallet-manager.js';
import {WalletPersistence} from './wallet-persistence.js';

/**
 * Implementation of wallet persistence using a config file
 */
export class ConfigFileWalletPersistence implements WalletPersistence {
  private walletConfig: string;

  /**
   * Create a new config file persistence
   * @param walletConfig Path to the config file (optional, defaults to $HOME/.sui-wallet/config.yaml)
   */
  constructor(walletConfig?: string) {
    if (walletConfig) {
      this.walletConfig = path.resolve(walletConfig);
    } else {
      // Default to $HOME/.sui-wallet/config.yaml
      this.walletConfig = path.join(os.homedir(), '.sui-wallet', 'config.yaml');
    }
  }

  /**
   * Load wallets from the config file
   * @returns A wallet configuration object
   */
  public loadWallets(): WalletConfig {
    try {
      if (!this.exists()) {
        // Create an empty config file at the default location
        this.createEmptyConfigFile();
        return { wallets: [] };
      }

      const configContent = fs.readFileSync(this.walletConfig, 'utf-8');
      const config: WalletConfig = yaml.parse(configContent);
      return config;
    } catch (error) {
      console.error(`Error loading wallet config from ${this.walletConfig}:`, error);
      return { wallets: [] };
    }
  }

  /**
   * Create an empty config file at the default location
   * @returns True if successful, false otherwise
   */
  private createEmptyConfigFile(): boolean {
    try {
      // Create the directory if it doesn't exist
      const configDir = path.dirname(this.walletConfig);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Create an empty config file
      const emptyConfig: WalletConfig = { wallets: [] };
      fs.writeFileSync(this.walletConfig, yaml.stringify(emptyConfig), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error creating empty config file at ${this.walletConfig}:`, error);
      return false;
    }
  }

  /**
   * Save wallets to the config file
   * @param wallets Array of wallet info objects
   * @param defaultWallet The default wallet address or name
   * @returns True if successful, false otherwise
   */
  public saveWallets(wallets: WalletInfo[], defaultWallet: string | null): boolean {
    try {
      // Create the directory if it doesn't exist
      const configDir = path.dirname(this.walletConfig);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Create the config object
      const config: WalletConfig = {
        wallets: wallets.map(wallet => ({
          address: wallet.address,
          name: wallet.name,
          privateKey: wallet.credentials?.privateKey,
          mnemonic: wallet.credentials?.mnemonic
        })),
        defaultWallet: defaultWallet || undefined
      };

      // Write to file
      fs.writeFileSync(this.walletConfig, yaml.stringify(config), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Error saving wallet config to ${this.walletConfig}:`, error);
      return false;
    }
  }

  /**
   * Check if the config file exists
   * @returns True if the file exists, false otherwise
   */
  public exists(): boolean {
    return fs.existsSync(this.walletConfig);
  }

  /**
   * Check if the persistence store is read-only
   * @returns Always false as config files are writable
   */
  public isReadOnly(): boolean {
    return false;
  }

  /**
   * Get the path to the config file
   * @returns The config file path
   */
  public getConfigPath(): string {
    return this.walletConfig;
  }

}
