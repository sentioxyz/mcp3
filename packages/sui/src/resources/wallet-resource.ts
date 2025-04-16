import {Registration} from '@mcp3/common';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the wallet address resource with the Registration
 * @param registration The Registration instance
 */
export function registerWalletResource(registration: Registration) {
    registration.addResource({
        name: "wallet",
        uri: "sui:///wallet",
        callback: async (uri) => {
            const walletAddress = registration.globalOptions.walletAddress;

            if (!walletAddress) {
                return {
                    contents: [
                        {
                            uri: uri.toString(),
                            mimeType: "text/plain",
                            text: `
## Wallet Address

No wallet address has been configured.

To set a wallet address, use one of the following methods:
1. Set the SUI_WALLET_ADDRESS environment variable
2. Use the --wallet-address command line option

Example:
\`\`\`
sui-mcp --wallet-address 0x123... <command>
\`\`\`
`
                        },
                    ]
                };
            }

            // Get additional wallet information if available
            interface WalletInfo {
                suiBalance?: {
                    totalBalance: string;
                    coinObjectCount: number;
                };
                objectsCount?: string | number;
            }

            let walletInfo: WalletInfo = {};
            try {
                const client = new SuiClient({
                    url: registration.globalOptions.nodeUrl
                });

                // Get SUI balance
                const suiBalance = await client.getBalance({
                    owner: walletAddress,
                    coinType: "0x2::sui::SUI"
                });

                // Get owned objects count
                const objects = await client.getOwnedObjects({
                    owner: walletAddress,
                    limit: 1,
                    options: {
                        showContent: false
                    }
                });

                walletInfo = {
                    suiBalance: suiBalance,
                    objectsCount: objects.hasNextPage ? "1+" : objects.data.length
                };
            } catch (error) {
                console.error("Error fetching wallet info:", error);
                // Continue even if we can't get additional info
            }

            return {
                contents: [
                    {
                        uri: uri.toString(),
                        mimeType: "text/plain",
                        text: `
## Wallet Address

Address: \`${walletAddress}\`

${Object.keys(walletInfo).length > 0 ? `
### Wallet Information
- SUI Balance: ${walletInfo.suiBalance?.totalBalance || 'Unknown'} (${walletInfo.suiBalance?.coinObjectCount || 0} coin objects)
- Owned Objects: ${walletInfo.objectsCount || 'Unknown'}
` : ''}

### Explorer Links
- [Sui Explorer](https://suiexplorer.com/address/${walletAddress})
- [SuiVision](https://suivision.xyz/account/${walletAddress})
`
                    },
                ]
            };
        }
    });
}
