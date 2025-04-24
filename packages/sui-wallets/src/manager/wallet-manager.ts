import {SuiClient} from '@mysten/sui/client';
import {Ed25519Keypair} from '@mysten/sui/keypairs/ed25519';
import {Secp256k1Keypair} from '@mysten/sui/keypairs/secp256k1';
import {Secp256r1Keypair} from '@mysten/sui/keypairs/secp256r1';
import {decodeSuiPrivateKey, Keypair, SignatureWithBytes} from '@mysten/sui/cryptography';
import {Transaction} from '@mysten/sui/transactions';
import {fromBase64} from '@mysten/sui/utils';
import * as bip39 from '@scure/bip39';
import {wordlist} from '@scure/bip39/wordlists/english';
import {ConfigFileWalletPersistence, EnvVarWalletPersistence, WalletPersistence} from './persistence/index.js';

import {SuiTransactionBlockResponse} from "@mysten/sui/client";

 /**
 * Interface for wallet credentials
 */
export interface WalletCredentials {
  privateKey?: string;
  mnemonic?: string;
}

/**
 * Interface for wallet information
 */
export interface WalletInfo {
  address: string;
  name: string;
  credentials?: WalletCredentials;
  keypair?: Keypair;
}

/**
 * Interface for wallet manager
 */
export interface IWalletManager {
  /**
   * List all wallets
   * @returns Array of wallet info objects
   */
  getAllWallets(): WalletInfo[];

  /**
   * Get the default wallet
   * @returns The default wallet info or null if not set
   */
  getDefaultWallet(): WalletInfo | null;

  /**
   * Get a wallet by address or name
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param options Options for wallet lookup
   * @returns The wallet info or null if not found
   */
  getWallet(
      addressOrName?: string,
      options?: {
        allowPartialMatch?: boolean,
        caseSensitive?: boolean
      }
  ): WalletInfo | null;

  /**
   * Sign a transaction
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param transaction The transaction to sign
   * @returns The signed transaction
   */
  signTransaction(
      addressOrName: string | undefined,
      transaction: Transaction
  ): Promise<SignatureWithBytes>;

  /**
   * Sign and submit a transaction
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param transaction The transaction to sign and submit
   * @returns The transaction response
   */
  signAndSubmitTransaction(
      addressOrName: string | undefined,
      transaction: Transaction
  ): Promise<SuiTransactionBlockResponse>;

  /**
   * Get the SUI client
   * @returns The SUI client
   */
  getClient(): SuiClient;
}


export interface WalletConfig {
  wallets: {
    address: string;
    name?: string;
    privateKey?: string;
    mnemonic?: string;
  }[];
  defaultWallet?: string;
}

export interface WalletManagerOptions {
  nodeUrl?: string;
  walletConfig?: string;
  persistence?: WalletPersistence | WalletPersistence[];
}

export class WalletManager implements IWalletManager {
  private wallets: Map<string, WalletInfo> = new Map();
  private nameToAddress: Map<string, string> = new Map();
  private defaultWallet: string | null = null;
  private client: SuiClient;
  private persistenceProviders: WalletPersistence[] = [];

  constructor(options: WalletManagerOptions = {}) {
    const nodeUrl = options.nodeUrl || process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443';
    this.client = new SuiClient({ url: nodeUrl });

    // Set up persistence providers
    if (options.persistence) {
      // If persistence is provided, use it
      if (Array.isArray(options.persistence)) {
        this.persistenceProviders = options.persistence;
      } else {
        this.persistenceProviders = [options.persistence];
      }
    } else {
      // Choose only one provider based on environment variables existence
      const envVarPersistence = new EnvVarWalletPersistence();

      if (envVarPersistence.exists()) {
        // If environment variables exist, use only EnvVarWalletPersistence
        this.persistenceProviders.push(envVarPersistence);
      } else {
        // Otherwise, use ConfigFileWalletPersistence
        const configFilePersistence = new ConfigFileWalletPersistence(options.walletConfig);
        this.persistenceProviders.push(configFilePersistence);
      }
    }

    // Load wallets from all persistence providers
    this.loadWallets();
  }

  /**
   * Load wallets from all persistence providers
   */
  private loadWallets(): void {
    // Process each persistence provider in order
    for (const provider of this.persistenceProviders) {
      if (provider.exists()) {
        const config = provider.loadWallets();

        // Add each wallet from the config
        config.wallets.forEach((wallet: { address: string; name?: string; privateKey?: string; mnemonic?: string }) => {
          const credentials: WalletCredentials = {};
          const name = wallet.name || this.generateShortAddress(wallet.address);

          // Prioritize mnemonic over a private key if both are present
          if (wallet.mnemonic) {
            credentials.mnemonic = wallet.mnemonic;
          } else if (wallet.privateKey) {
            credentials.privateKey = wallet.privateKey;
          }

          // Only add if not already added (first provider takes precedence)
          if (!this.wallets.has(wallet.address)) {
            this.addWalletToMemory(wallet.address, name, credentials);
          }
        });

        // Set default wallet if specified in config and not already set
        if (config.defaultWallet && !this.defaultWallet) {
          this.defaultWallet = config.defaultWallet;
        }
      }
    }

    // If no default wallet is set but we have wallets, use the first one
    if (!this.defaultWallet && this.wallets.size > 0) {
      this.defaultWallet = Array.from(this.wallets.keys())[0];
    }
  }

  /**
   * Save wallets to all writable persistence providers
   */
  private saveWallets(): void {
    const wallets = this.getAllWallets();

    // Save to each writable persistence provider
    for (const provider of this.persistenceProviders) {
      if (!provider.isReadOnly()) {
        provider.saveWallets(wallets, this.defaultWallet);
      }
    }
  }

  /**
   * Add a wallet to memory without saving to persistence
   * @param address Wallet address
   * @param name Optional wallet name (defaults to shortened address)
   * @param credentials Optional wallet credentials
   */
  private addWalletToMemory(address: string, name?: string, credentials?: WalletCredentials): void {
    // Normalize the address (ensure it has 0x prefix)
    const normalizedAddress = address.startsWith('0x') ? address : `0x${address}`;

    // Generate a name if not provided
    const walletName = name || this.generateShortAddress(normalizedAddress);

    // Create wallet info
    const walletInfo: WalletInfo = {
      address: normalizedAddress,
      name: walletName,
      credentials
    };

    // Create keypair if credentials are provided
    if (credentials) {
      try {
        if (credentials.mnemonic) {
          // Create keypair from mnemonic
          walletInfo.keypair = Ed25519Keypair.deriveKeypair(credentials.mnemonic);
        } else if (credentials.privateKey) {
          // Check if it's a Bech32-encoded private key (suiprivkey1...)
          if (credentials.privateKey.startsWith('suiprivkey1')) {
            try {
              // Decode the Bech32-encoded private key
              const { schema, secretKey } = decodeSuiPrivateKey(credentials.privateKey);

              // Create the appropriate keypair based on the key scheme
              switch (schema) {
                case 'ED25519':
                  walletInfo.keypair = Ed25519Keypair.fromSecretKey(secretKey);
                  break;
                case 'Secp256k1':
                  walletInfo.keypair = Secp256k1Keypair.fromSecretKey(secretKey);
                  break;
                case 'Secp256r1':
                  walletInfo.keypair = Secp256r1Keypair.fromSecretKey(secretKey);
                  break;
                default:
                  console.warn(`Unsupported key scheme: ${schema} for wallet ${normalizedAddress}`);
              }
            } catch (e) {
              console.warn(`Could not parse Bech32 private key for wallet ${normalizedAddress}: ${e}`);
            }
          } else {
            // Try to parse as base64 string (legacy format)
            try {
              const privateKeyBytes = fromBase64(credentials.privateKey);
              walletInfo.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
            } catch (e) {
              // If it's not a valid base64 string, it might be a serialized keypair
              console.warn(`Could not parse private key as base64 for wallet ${normalizedAddress}. Using as is.`);
            }
          }
        }
      } catch (error) {
        console.error(`Error creating keypair for wallet ${normalizedAddress}:`, error);
      }
    }

    // Add wallet to the map
    this.wallets.set(normalizedAddress, walletInfo);

    // Add name to address mapping
    this.nameToAddress.set(walletName, normalizedAddress);

    // If this is the first wallet and no default is set, make it the default
    if (!this.defaultWallet) {
      this.defaultWallet = normalizedAddress;
    }
  }

  /**
   * Generate a short address for use as a default name
   * @param address The full address
   * @returns A shortened version of the address
   */
  private generateShortAddress(address: string): string {
    // Normalize the address (ensure it has 0x prefix)
    const normalizedAddress = address.startsWith('0x') ? address : `0x${address}`;

    // Take the first 6 and last 4 characters
    if (normalizedAddress.length >= 10) {
      return `${normalizedAddress.substring(0, 6)}...${normalizedAddress.substring(normalizedAddress.length - 4)}`;
    }

    return normalizedAddress;
  }

  /**
   * Add a wallet to the manager
   * @param address Wallet address
   * @param name Optional wallet name (defaults to shortened address)
   * @param credentials Optional wallet credentials
   */
  public addWallet(address: string, name?: string, credentials?: WalletCredentials): void {
    // Add wallet to memory
    this.addWalletToMemory(address, name, credentials);

    // Save to persistence
    this.saveWallets();
  }

  /**
   * Remove a wallet from the manager
   * @param addressOrName Wallet address or name
   */
  public removeWallet(addressOrName: string): boolean {
    // Check if this is a name or address
    let normalizedAddress: string;

    if (addressOrName.startsWith('0x')) {
      // It's an address
      normalizedAddress = addressOrName;
    } else {
      // It might be a name
      const address = this.nameToAddress.get(addressOrName);
      if (!address) {
        return false; // Name not found
      }
      normalizedAddress = address;
    }

    // Get the wallet info before removing
    const walletInfo = this.wallets.get(normalizedAddress);
    if (!walletInfo) {
      return false;
    }

    // Remove the name to address mapping
    this.nameToAddress.delete(walletInfo.name);

    // Remove the wallet
    const result = this.wallets.delete(normalizedAddress);

    // If the default wallet was removed, update it
    if (this.defaultWallet === normalizedAddress || this.defaultWallet === walletInfo.name) {
      this.defaultWallet = this.wallets.size > 0 ?
        Array.from(this.wallets.keys())[0] : null;
    }

    // Save changes to persistence
    if (result) {
      this.saveWallets();
    }

    return result;
  }

  /**
   * Get a wallet by address or name
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param options Options for getting the wallet
   * @returns The wallet info or null if not found
   */
  public getWallet(addressOrName?: string, options: {
    allowPartialMatch?: boolean,
    caseSensitive?: boolean
  } = {}): WalletInfo | null {
    // Set default options
    const {
      allowPartialMatch = false,
      caseSensitive = true
    } = options;

    // If no address/name is provided, use the default
    const identifier = addressOrName || this.defaultWallet;

    if (!identifier) {
      return null;
    }

    // Try exact match first
    if (identifier.startsWith('0x')) {
      // It's an address - try exact match
      const wallet = this.wallets.get(identifier);
      if (wallet) {
        return wallet;
      }
    } else {
      // It might be a name - try exact match
      const address = this.nameToAddress.get(identifier);
      if (address) {
        return this.wallets.get(address) || null;
      }
    }

    // If we get here, no exact match was found
    // Try partial match if allowed
    if (allowPartialMatch) {
      // Search for wallets with partial match
      const results = this.searchWallets(identifier, {
        matchName: true,
        matchAddress: true,
        caseSensitive,
        limit: 1
      });

      // Return the first match if any
      if (results.length > 0) {
        return results[0];
      }
    }

    // No match found
    return null;
  }

  /**
   * Get all wallets
   * @returns Array of wallet info objects
   */
  public getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  /**
   * Set the default wallet
   * @param addressOrName Wallet address or name
   * @returns True if successful, false if wallet not found
   */
  public setDefaultWallet(addressOrName: string): boolean {
    // Check if this is a name or address
    if (addressOrName.startsWith('0x')) {
      // It's an address
      // Check if the wallet exists
      if (!this.wallets.has(addressOrName)) {
        return false;
      }

      // Set as default
      this.defaultWallet = addressOrName;
    } else {
      // It might be a name
      const address = this.nameToAddress.get(addressOrName);
      if (!address) {
        return false; // Name not found
      }

      // Set as default (using the name)
      this.defaultWallet = addressOrName;
    }

    // Save changes to persistence
    this.saveWallets();
    return true;
  }

  /**
   * Get the default wallet
   * @returns The default wallet info or null if none is set
   */
  public getDefaultWallet(): WalletInfo | null {
    if (!this.defaultWallet) {
      return null;
    }

    // If the default is an address, get the wallet info directly
    if (this.defaultWallet.startsWith('0x')) {
      return this.wallets.get(this.defaultWallet) || null;
    } else {
      // If the default is a name, get the address first, then the wallet info
      const address = this.nameToAddress.get(this.defaultWallet);
      if (address) {
        return this.wallets.get(address) || null;
      }
    }

    return null;
  }

  /**
   * Get the balance of a wallet
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param coinType Coin type (optional, defaults to SUI)
   * @returns The balance information
   */
  public async getBalance(addressOrName?: string, coinType: string = '0x2::sui::SUI') {
    // Get the wallet
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get the balance
    return this.client.getBalance({
      owner: wallet.address,
      coinType
    });
  }

  /**
   * Get all balances for a wallet
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @returns Array of balance information for all coin types
   */
  public async getAllBalances(addressOrName?: string) {
    // Get the wallet
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get all balances
    return this.client.getAllBalances({
      owner: wallet.address
    });
  }

  /**
   * Get all coins for a wallet
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param coinType Coin type (optional)
   * @param limit Maximum number of coins to return (optional)
   * @returns Array of coin objects
   */
  public async getCoins(addressOrName?: string, coinType?: string, limit?: number) {
    // Get the wallet
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get coins
    return this.client.getCoins({
      owner: wallet.address,
      coinType,
      limit
    });
  }

  /**
   * Sign a transaction
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param transaction The transaction to sign
   * @returns The signed transaction bytes
   * @throws Error if the wallet doesn't have a keypair
   */
  public async signTransaction(addressOrName: string | undefined, transaction: Transaction) {
    // Get the wallet
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // If the wallet has a keypair, sign the transaction directly
    if (wallet.keypair) {
      return transaction.sign({ signer: wallet.keypair });
    }

    // If the wallet doesn't have a keypair, throw an error
    throw new Error(`Wallet ${wallet.address} does not have a keypair. External signing is required.`);
  }

  /**
   * Sign and submit a transaction
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param transaction The transaction to sign and submit
   * @returns The transaction response
   */
  public async signAndSubmitTransaction(addressOrName: string | undefined, transaction: Transaction) {
    // Sign the transaction
    const signedTx = await this.signTransaction(addressOrName, transaction);

    // Execute the transaction
    return this.client.executeTransactionBlock({
      transactionBlock: signedTx.bytes,
      signature: signedTx.signature,
      options: {
        showEffects: true,
        showEvents: true
      }
    });
  }

  /**
   * Get the SUI client
   * @returns The SUI client
   */
  public getClient(): SuiClient {
    return this.client;
  }

  /**
   * Sign and execute a transaction (alias for signAndSubmitTransaction for backward compatibility)
   * @param addressOrName Wallet address or name (optional, uses default if not provided)
   * @param transaction The transaction to sign and execute
   * @returns The transaction response
   */
  public async signAndExecuteTransaction(addressOrName: string | undefined, transaction: Transaction) {
    return this.signAndSubmitTransaction(addressOrName, transaction);
  }

  /**
   * Generate a keypair with mnemonic
   * @returns The generated keypair and mnemonic
   */
  private generateKeypairWithMnemonic(): { keypair: Ed25519Keypair, mnemonic: string } {
    // Generate a cryptographically secure random mnemonic using BIP-39
    const entropy = new Uint8Array(16); // 128 bits = 12 words
    crypto.getRandomValues(entropy);
    const mnemonic = bip39.entropyToMnemonic(entropy, wordlist);

    // Derive keypair from mnemonic
    const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

    return { keypair, mnemonic };
  }

  /**
   * Generate a new wallet with a random keypair
   * @param name Optional name for the wallet
   * @returns The generated wallet info
   */
  public generateWallet(name?: string): { walletInfo: WalletInfo, mnemonic: string } {
    // Generate a new keypair with mnemonic
    const { keypair, mnemonic } = this.generateKeypairWithMnemonic();

    // Get the address
    const address = keypair.toSuiAddress();

    // Generate a default name if not provided
    const walletName = name || `Wallet-${address.substring(0, 6)}`;

    // Create the wallet info
    const walletInfo: WalletInfo = {
      address,
      name: walletName,
      credentials: {
        mnemonic
      },
      keypair
    };

    // Add the wallet
    this.wallets.set(address, walletInfo);
    this.nameToAddress.set(walletName, address);

    // Set as default if it's the first wallet
    if (!this.defaultWallet) {
      this.defaultWallet = address;
    }

    // Save to persistence
    this.saveWallets();

    return { walletInfo, mnemonic };
  }

  /**
   * Export the mnemonic for a wallet
   * @param addressOrName Wallet address or name
   * @returns The mnemonic phrase or null if not available
   */
  public exportMnemonic(addressOrName: string): string | null {
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      return null;
    }

    return wallet.credentials?.mnemonic || null;
  }

  /**
   * Export the private key for a wallet
   * @param addressOrName Wallet address or name
   * @param format The format to export the private key in ('base64' or 'bech32')
   * @returns The private key or null if not available
   */
  public exportPrivateKey(addressOrName: string, format: 'base64' | 'bech32' = 'base64'): string | null {
    const wallet = this.getWallet(addressOrName);

    if (!wallet) {
      return null;
    }

    // If we have a private key in credentials, return it
    // Note: This might not be in the requested format
    if (wallet.credentials?.privateKey) {
      // If the stored key is already in Bech32 format and that's what was requested, return it
      if (format === 'bech32' && wallet.credentials.privateKey.startsWith('suiprivkey1')) {
        return wallet.credentials.privateKey;
      }
      // If the stored key is in base64 format and that's what was requested, return it
      if (format === 'base64' && !wallet.credentials.privateKey.startsWith('suiprivkey1')) {
        return wallet.credentials.privateKey;
      }
      // Otherwise, we need to convert the format, but we can't do that without the keypair
      // So we'll fall through to the keypair export logic
    }

    // If we have a keypair, export the private key in the requested format
    if (wallet.keypair) {
      try {
        if (format === 'base64') {
          const privateKeyBytes = wallet.keypair.getSecretKey();
          return Buffer.from(privateKeyBytes).toString('base64');
        } else if (format === 'bech32') {
          // For Bech32 format, we need to use the Sui SDK's encoding
          // This is typically handled by the Sui CLI, but we can use the same approach
          // Note: This is a simplified approach and might need adjustment based on the actual keypair type
          const privateKeyBytes = wallet.keypair.getSecretKey();

          // We would need to determine the key scheme and use the appropriate encoding
          // This is a placeholder and would need to be implemented based on the Sui SDK's approach
          // For now, we'll just return a warning message
          console.warn('Bech32 export format is not fully implemented yet. Using base64 instead.');
          return Buffer.from(privateKeyBytes).toString('base64');
        }
      } catch (error) {
        console.error(`Error exporting private key for wallet ${wallet.address}:`, error);
      }
    }

    return null;
  }

  /**
   * Search for wallets by partial name or address match
   * @param query The search query (partial name or address)
   * @param options Search options
   * @returns Array of matching wallet info objects
   */
  public searchWallets(query: string, options: {
    matchName?: boolean,
    matchAddress?: boolean,
    caseSensitive?: boolean,
    limit?: number
  } = {}): WalletInfo[] {
    // Set default options
    const {
      matchName = true,
      matchAddress = true,
      caseSensitive = false,
      limit = 0
    } = options;

    if (!matchName && !matchAddress) {
      return [];
    }

    // Normalize the query if case-insensitive
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();

    // Get all wallets
    const allWallets = this.getAllWallets();

    // Filter wallets based on the query
    const results = allWallets.filter(wallet => {
      // Check name match if enabled
      if (matchName) {
        const walletName = caseSensitive ? wallet.name : wallet.name.toLowerCase();
        if (walletName.includes(normalizedQuery)) {
          return true;
        }
      }

      // Check address match if enabled
      if (matchAddress) {
        const walletAddress = caseSensitive ? wallet.address : wallet.address.toLowerCase();
        if (walletAddress.includes(normalizedQuery)) {
          return true;
        }
      }

      return false;
    });

    // Apply limit if specified
    if (limit > 0 && results.length > limit) {
      return results.slice(0, limit);
    }

    return results;
  }
}


