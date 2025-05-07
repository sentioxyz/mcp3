import {z} from 'zod';
import {SuiClient} from '@mysten/sui/client';
import {Registration} from "@mcp3/common";

// Define a type for the WalletManager to avoid direct import dependency
interface WalletManagerLike {
    getDefaultWallet(): { address: string } | null;
    getWallet(addressOrName?: string, options?: { allowPartialMatch?: boolean, caseSensitive?: boolean }): { address: string } | null;
}

/**
 * Register the balance tool with the Registration
 * @param registration The Registration instance
 */
export function registerBalanceTool(registration: Registration) {
    // Register the get-balance tool
    registration.addTool({
        name: 'sui-get-balance',
        description: 'Get the balance of a specific coin type for a wallet address',
        args: {
            owner: z.string().describe('The wallet address to check'),
            coinType: z.string().describe('The coin type to check (e.g., 0x2::sui::SUI)').optional()
        },
        callback: async ({ owner, coinType }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });

                const walletAddress = owner

                if (!walletAddress) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No wallet address provided and no default wallet address configured.'
                        }],
                        isError: true
                    };
                }

                // Get the balance
                const balance = await client.getBalance({
                    owner: walletAddress,
                    coinType: coinType
                });

                // Format the balance for display
                const formattedBalance = {
                    coinType: balance.coinType,
                    totalBalance: balance.totalBalance.toString(),
                    // Convert to a more readable format (e.g., SUI instead of MIST)
                    // 1 SUI = 10^9 MIST
                    formattedBalance: (Number(balance.totalBalance) / 1_000_000_000).toFixed(9)
                };

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(formattedBalance, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get balance: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });

    // Register the get-all-balances tool
    registration.addTool({
        name: 'sui-get-all-balances',
        description: 'Get all coin balances for a wallet address',
        args: {
            owner: z.string().describe('The wallet address to check')
        },
        callback: async ({ owner }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });
                const walletAddress = owner

                if (!walletAddress) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No wallet address provided and no default wallet address configured.'
                        }],
                        isError: true
                    };
                }

                // Get all balances
                const balances = await client.getAllBalances({
                    owner: walletAddress
                });

                // Format the balances for display
                const formattedBalances = balances.map(balance => ({
                    coinType: balance.coinType,
                    totalBalance: balance.totalBalance.toString(),
                    // Convert to a more readable format if it's SUI
                    formattedBalance: balance.coinType === '0x2::sui::SUI' 
                        ? (Number(balance.totalBalance) / 1_000_000_000).toFixed(9) + ' SUI'
                        : balance.totalBalance.toString()
                }));

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(formattedBalances, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get all balances: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });

    // Register the get-coins tool
    registration.addTool({
        name: 'sui-get-coins',
        description: 'Get detailed information about coins owned by a wallet address',
        args: {
            owner: z.string().describe('The wallet address to check'),
            coinType: z.string().optional().describe('The coin type to filter by (optional)'),
            limit: z.number().optional().describe('Maximum number of coins to return')
        },
        callback: async ({ owner, coinType, limit }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });
                const walletAddress = owner
                if (!walletAddress) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No wallet address provided and no default wallet address configured.'
                        }],
                        isError: true
                    };
                }

                const coins = await client.getAllCoins({
                    owner: walletAddress,
                    limit: limit || null
                });

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            coins: coins.data,
                            hasNextPage: coins.hasNextPage,
                            nextCursor: coins.nextCursor
                        }, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get coins: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });

    // Register the get-coin-metadata tool
    registration.addTool({
        name: 'sui-get-coin-metadata',
        description: 'Get metadata for a specific coin type',
        args: {
            coinType: z.string().describe('The coin type to get metadata for (e.g., 0x2::sui::SUI)')
        },
        callback: async ({ coinType }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });
                const metadata = await client.getCoinMetadata({
                    coinType
                });

                if (!metadata) {
                    return {
                        content: [{
                            type: 'text',
                            text: `No metadata found for coin type: ${coinType}`
                        }]
                    };
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(metadata, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to get coin metadata: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
