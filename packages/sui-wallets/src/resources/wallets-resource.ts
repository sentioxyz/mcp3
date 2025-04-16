import { Registration } from '@mcp3/common';
import { WalletManager } from '../manager/index.js';
import { SuiClient } from '@mysten/sui/client';

/**
 * Register the wallets resource with the Registration
 * @param registration The Registration instance
 */
export function registerWalletsResource(registration: Registration) {
  registration.addResource({
    name: "wallets",
    uri: "sui:///wallets",
    callback: async (uri) => {
      try {
        const walletManager = new WalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        const wallets = walletManager.getAllWallets();
        const defaultWalletInfo = walletManager.getDefaultWallet();
        const defaultWalletAddress = defaultWalletInfo?.address;

        if (wallets.length === 0) {
          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: "text/plain",
                text: `
## Sui Wallets

No wallets have been configured.

To configure wallets, use one of the following methods:
1. Set the SUI_WALLET_ADDRESSES environment variable (comma-separated list)
2. Create a wallet configuration file and set SUI_WALLET_CONFIG_PATH
3. Use the sui-wallets-add command

Example:
\`\`\`
sui-wallets add --address 0x123... --name "My Wallet" --private-key your-private-key
\`\`\`
`
              },
            ]
          };
        }

        // Get additional wallet information if available
        const client = new SuiClient({
          url: registration.globalOptions.nodeUrl
        });

        // Get wallet information for each wallet
        const walletInfoPromises = wallets.map(async (wallet) => {
          try {
            // Get SUI balance
            const suiBalance = await client.getBalance({
              owner: wallet.address,
              coinType: "0x2::sui::SUI"
            });

            // Get owned objects count
            const objects = await client.getOwnedObjects({
              owner: wallet.address,
              limit: 1,
              options: {
                showContent: false
              }
            });

            return {
              address: wallet.address,
              isDefault: wallet.address === defaultWalletAddress,
              hasCredentials: !!wallet.credentials,
              hasKeypair: !!wallet.keypair,
              suiBalance,
              objectsCount: objects.hasNextPage ? "1+" : objects.data.length
            };
          } catch (error) {
            console.error(`Error fetching wallet info for ${wallet.address}:`, error);
            return {
              address: wallet.address,
              name: wallet.name,
              isDefault: wallet.address === defaultWalletAddress,
              hasCredentials: !!wallet.credentials,
              hasKeypair: !!wallet.keypair,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        const walletsInfo = await Promise.all(walletInfoPromises);

        // Format wallet information as markdown
        const walletMarkdown = walletsInfo.map(wallet => {
          const isDefault = wallet.isDefault ? ' (Default)' : '';
          const hasCredentials = wallet.hasCredentials ? '✓' : '✗';
          const hasKeypair = wallet.hasKeypair ? '✓' : '✗';

          let balanceInfo = '';
          if ('suiBalance' in wallet && wallet.suiBalance) {
            balanceInfo = `
- SUI Balance: ${wallet.suiBalance.totalBalance} (${wallet.suiBalance.coinObjectCount} coin objects)
- Owned Objects: ${wallet.objectsCount}`;
          } else if ('error' in wallet) {
            balanceInfo = `
- Error: ${wallet.error}`;
          }

          return `
### Wallet: ${wallet.name}${isDefault}

- Address: \`${wallet.address}\`
- Has Credentials: ${hasCredentials}
- Has Keypair: ${hasKeypair}${balanceInfo}

#### Explorer Links
- [Sui Explorer](https://suiexplorer.com/address/${wallet.address})
- [SuiVision](https://suivision.xyz/account/${wallet.address})
`;
        }).join('\n');

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/plain",
              text: `
## Sui Wallets

${wallets.length} wallet(s) configured.

${walletMarkdown}

### Wallet Management Commands

- List wallets: \`sui-wallets list\`
- Generate wallet: \`sui-wallets-generate [--name "My Wallet"] [--saveToConfig true]\`
- Add wallet: \`sui-wallets add --address <address> --name "My Wallet" [--private-key <key>] [--mnemonic <phrase>]\`
- Remove wallet: \`sui-wallets remove --address <address>\` or \`sui-wallets remove --address "My Wallet"\`
- Set default: \`sui-wallets set-default --identifier <address-or-name>\`
- Get wallet: \`sui-wallets-get --identifier <address-or-name> --allowPartialMatch true\`
- Search wallets: \`sui-wallets-search --query <partial-name-or-address>\`
- Export mnemonic: \`sui-wallets-export-mnemonic --identifier <address-or-name>\`
- Export private key: \`sui-wallets-export-private-key --identifier <address-or-name>\`
- Get balance: \`sui-wallets-balance [--identifier <address-or-name>] [--coin-type <type>]\`
- Get all balances: \`sui-wallets-all-balances [--identifier <address-or-name>]\`

### Partial Matching Functionality

#### Get a Specific Wallet

You can get a specific wallet using partial matching when an exact match is not found:

\`\`\`
sui-wallets-get --identifier "Ma" --allowPartialMatch true --caseSensitive false
\`\`\`

Options:
- \`--allowPartialMatch\`: Whether to allow partial matching if exact match not found (default: true)
- \`--caseSensitive\`: Whether the matching should be case-sensitive (default: false)

#### Search for Multiple Wallets

You can search for wallets by partial name or address match using the search command:

\`\`\`
sui-wallets-search --query "Main" --matchName true --matchAddress true --caseSensitive false --limit 5
\`\`\`

Options:
- \`--matchName\`: Whether to match against wallet names (default: true)
- \`--matchAddress\`: Whether to match against wallet addresses (default: true)
- \`--caseSensitive\`: Whether the search should be case-sensitive (default: false)
- \`--limit\`: Maximum number of results to return, 0 for unlimited (default: 0)
`
            },
          ]
        };
      } catch (error) {
        console.error("Error creating wallets resource:", error);

        return {
          contents: [
            {
              uri: uri.toString(),
              mimeType: "text/plain",
              text: `
## Sui Wallets

Error loading wallet information: ${error instanceof Error ? error.message : 'Unknown error'}
`
            },
          ]
        };
      }
    }
  });
}
