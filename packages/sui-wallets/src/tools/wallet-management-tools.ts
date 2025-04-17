import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {ConfigFileWalletPersistence, WalletManager} from '../manager/index.js';


/**
 * Register wallet management tools with the Registration
 * @param registration The Registration instance
 */
export function registerWalletManagementTools(registration: Registration) {
  // Register the tool for listing wallets
  registration.addTool({
    name: 'sui-wallets-list',
    description: 'List all configured wallets',
    args: {},
    callback: async (_, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        const wallets = walletManager.getAllWallets();
        const defaultWalletInfo = walletManager.getDefaultWallet();
        const defaultWalletAddress = defaultWalletInfo?.address;

        // Format wallet information for display
        const walletInfo = wallets.map(wallet => ({
          name: wallet.name,
          address: wallet.address,
          isDefault: wallet.address === defaultWalletAddress,
          hasCredentials: !!wallet.credentials,
          hasKeypair: !!wallet.keypair
        }));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(walletInfo, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to list wallets: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for adding a wallet
  registration.addTool({
    name: 'sui-wallets-add',
    description: 'Add a new wallet',
    args: {
      address: z.string().describe('The wallet address to add'),
      name: z.string().describe('A friendly name for the wallet (optional)').optional(),
      privateKey: z.string().describe('The private key for the wallet (optional)').optional(),
      mnemonic: z.string().describe('The mnemonic phrase for the wallet (optional)').optional(),
      setDefault: z.boolean().describe('Set this wallet as the default').default(false)
    },
    callback: async ({ address, name, privateKey, mnemonic, setDefault }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Add the wallet
        walletManager.addWallet(address, name, {
          privateKey,
          mnemonic
        });

        // Set as default if requested
        if (setDefault) {
          walletManager.setDefaultWallet(address);
        }

        // Get the wallet to get its name
        const wallet = walletManager.getWallet(address);

        return {
          content: [{
            type: 'text',
            text: `Wallet ${wallet?.name} (${address}) added successfully${setDefault ? ' and set as default' : ''}.`
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to add wallet: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for removing a wallet
  registration.addTool({
    name: 'sui-wallets-remove',
    description: 'Remove a wallet by address or name',
    args: {
      identifier: z.string().describe('The wallet address or name to remove')
    },
    callback: async ({ identifier }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Get the wallet first to display its name and address in the success message
        const wallet = walletManager.getWallet(identifier);

        // Remove the wallet
        const result = walletManager.removeWallet(identifier);

        if (result) {
          return {
            content: [{
              type: 'text',
              text: `Wallet ${wallet?.name} (${wallet?.address}) removed successfully.`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Wallet with identifier "${identifier}" not found.`
            }],
            isError: true
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to remove wallet: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for setting the default wallet
  registration.addTool({
    name: 'sui-wallets-set-default',
    description: 'Set the default wallet',
    args: {
      identifier: z.string().describe('The wallet address or name to set as default')
    },
    callback: async ({ identifier }, extra) => {
      try {
        // Import necessary modules
        const os = await import('os');
        const fs = await import('fs');
        const path = await import('path');

        // Get wallet config path
        const defaultWalletConfig = path.join(os.homedir(), '.sui-wallet', 'config.json');
        const walletConfig = registration.globalOptions.walletConfig || defaultWalletConfig;

        // Create a file persistence provider
        const filePersistence = new ConfigFileWalletPersistence(walletConfig);

        // Create wallet manager with the file persistence
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          persistence: filePersistence
        });

        // Set the default wallet (this will automatically save to the persistence)
        const result = walletManager.setDefaultWallet(identifier);

        if (result) {
          // Get the wallet to display its name and address
          const wallet = walletManager.getWallet(identifier);

          return {
            content: [{
              type: 'text',
              text: `Wallet ${wallet?.name} (${wallet?.address}) set as default.`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Wallet with identifier "${identifier}" not found.`
            }],
            isError: true
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to set default wallet: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Export and import config tools have been removed as requested

  // Register the tool for generating a new wallet
  registration.addTool({
    name: 'sui-wallets-generate',
    description: 'Generate a new wallet with a random keypair',
    args: {
      name: z.string().describe('A friendly name for the wallet').optional(),
      saveToConfig: z.boolean().describe('Whether to save the wallet to the config file').default(true)
    },
    callback: async ({ name, saveToConfig }, extra) => {
      try {
        // Import the necessary modules
        const os = await import('os');
        const fs = await import('fs');
        const path = await import('path');

        // Determine which persistence to use
        let persistence;
        if (saveToConfig) {
          // Get wallet config path
          const defaultWalletConfig = path.join(os.homedir(), '.sui-wallet', 'config.json');
          const walletConfig = registration.globalOptions.walletConfig || defaultWalletConfig;
          persistence = new ConfigFileWalletPersistence(walletConfig);
        } else {
          // Use in-memory only (no persistence)
          persistence = [];
        }

        // Create wallet manager with the appropriate persistence
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          persistence
        });

        // Generate a new wallet
        const { walletInfo, mnemonic } = walletManager.generateWallet(name);

        // If saving to config, handle that process
        if (saveToConfig) {
          // Get wallet config path
          const defaultWalletConfig = path.join(os.homedir(), '.sui-wallet', 'config.json');
          const walletConfig = registration.globalOptions.walletConfig || defaultWalletConfig;

          // Ensure the directory exists
          const configDir = path.dirname(walletConfig);
          if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
          }

          // Load existing config if it exists
          let config: { wallets: any[], defaultWallet: string | null } = {
            wallets: [],
            defaultWallet: null
          };

          if (fs.existsSync(walletConfig)) {
            try {
              const configContent = fs.readFileSync(walletConfig, 'utf-8');
              config = JSON.parse(configContent);
            } catch (e) {
              console.error(`Error reading config file: ${e}`);
            }
          }

          // Add the new wallet to the config
          config.wallets.push({
            address: walletInfo.address,
            name: walletInfo.name,
            mnemonic: mnemonic
          });

          // Set as default if it's the first wallet
          if (!config.defaultWallet) {
            config.defaultWallet = walletInfo.name;
          }

          // Write to file
          fs.writeFileSync(walletConfig, JSON.stringify(config, null, 2));
        }

        // If not saving to config, we MUST display the mnemonic or it will be lost forever
        if (!saveToConfig) {
          return {
            content: [{
              type: 'text',
              text: `Generated new wallet:\n\nName: ${walletInfo.name}\nAddress: ${walletInfo.address}\n\n⚠️ IMPORTANT: Since you chose not to save the wallet to a config file,\nthe mnemonic is displayed below. This is your ONLY chance to save it!\n\nMnemonic: ${mnemonic}\n\nPlease store this mnemonic phrase in a secure location.`
            }]
          };
        } else {
          // Get the wallet config path for the message
          const defaultWalletConfig = path.join(os.homedir(), '.sui-wallet', 'config.json');
          const walletConfig = registration.globalOptions.walletConfig || defaultWalletConfig;

          // If saving to config, don't display the mnemonic for security
          return {
            content: [{
              type: 'text',
              text: `Generated new wallet:\n\nName: ${walletInfo.name}\nAddress: ${walletInfo.address}\n\n⚠️ IMPORTANT: For security reasons, the mnemonic is not displayed here.\nUse the following command to view your mnemonic when needed:\n\nsui-wallets-export-mnemonic --identifier "${walletInfo.name}"\n\nWallet saved to ${walletConfig}`
            }]
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to generate wallet: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for exporting mnemonics
  registration.addTool({
    name: 'sui-wallets-export-mnemonic',
    description: 'Export the mnemonic phrase for a wallet',
    args: {
      identifier: z.string().describe('The wallet address or name to export the mnemonic for')
    },
    callback: async ({ identifier }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Export the mnemonic
        const mnemonic = walletManager.exportMnemonic(identifier);

        if (!mnemonic) {
          return {
            content: [{
              type: 'text',
              text: `No mnemonic found for wallet "${identifier}". The wallet may have been created with a private key or the mnemonic was not saved.`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: `Mnemonic for wallet "${identifier}":\n\n${mnemonic}\n\n⚠️ IMPORTANT: Keep this mnemonic phrase secure. Anyone with access to it can control your wallet!`
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to export mnemonic: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for exporting private keys
  registration.addTool({
    name: 'sui-wallets-export-private-key',
    description: 'Export the private key for a wallet',
    args: {
      identifier: z.string().describe('The wallet address or name to export the private key for'),
      format: z.enum(['base64', 'bech32']).describe('The format to export the private key in').default('base64')
    },
    callback: async ({ identifier, format }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Export the private key in the requested format
        const privateKey = walletManager.exportPrivateKey(identifier, format);

        if (!privateKey) {
          return {
            content: [{
              type: 'text',
              text: `No private key found for wallet "${identifier}". The wallet may not have a private key or it cannot be exported.`
            }],
            isError: true
          };
        }

        return {
          content: [{
            type: 'text',
            text: `Private key for wallet "${identifier}" (${format} format):\n\n${privateKey}\n\n⚠️ IMPORTANT: Keep this private key secure. Anyone with access to it can control your wallet!`
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to export private key: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Register the tool for getting a wallet by partial match
  registration.addTool({
    name: 'sui-wallets-get',
    description: 'Get a wallet by name or address, with optional partial matching',
    args: {
      identifier: z.string().describe('The wallet name or address to get'),
      allowPartialMatch: z.boolean().describe('Whether to allow partial matching if exact match not found').default(true),
      caseSensitive: z.boolean().describe('Whether the matching should be case-sensitive').default(false)
    },
    callback: async ({ identifier, allowPartialMatch, caseSensitive }, extra) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        // Get the wallet
        const wallet = walletManager.getWallet(identifier, {
          allowPartialMatch,
          caseSensitive
        });

        if (!wallet) {
          return {
            content: [{
              type: 'text',
              text: `No wallet found matching "${identifier}"`
            }],
            isError: true
          };
        }

        // Format wallet for display
        const defaultWallet = walletManager.getDefaultWallet();
        const isDefault = defaultWallet ? wallet.address === defaultWallet.address : false;

        const formattedWallet = {
          name: wallet.name,
          address: wallet.address,
          isDefault,
          hasCredentials: !!wallet.credentials,
          hasKeypair: !!wallet.keypair
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formattedWallet, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{
            type: 'text',
            text: `Failed to get wallet: ${errorMessage}`
          }],
          isError: true
        };
      }
    }
  });

  // Search tool has been removed as requested
}
