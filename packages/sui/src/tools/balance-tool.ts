import {z} from 'zod';
import {SuiClient} from '@mysten/sui/client';
import {Registration} from "@mcp3/common";
import {getDefaultWalletAddress} from "../address.js";

// Define a type for the WalletManager to avoid direct import dependency
interface WalletManagerLike {
    getDefaultWallet(): { address: string } | null;
    getWallet(addressOrName?: string, options?: { allowPartialMatch?: boolean, caseSensitive?: boolean }): { address: string } | null;
}

export function registerBalanceTool(registration: Registration) {

     registration.addTool({
        name: 'sui-get-balance',
        description: 'Get the balance of a specific coin type for a wallet address. Returns all balances if coinType is not specified.',
        args: {
            owner: z.string().optional().describe('The wallet address to get the balance for. Uses the default wallet if not specified.'),
            coinType: z.string().optional().describe('The coin type (e.g., "0x2::sui::SUI"). Returns all balances if not specified.')
        },
        callback: async ({ owner, coinType }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });

                const walletAddress = owner ?? (await getDefaultWalletAddress(registration))?.getDefaultWallet()?.address;

                if (!walletAddress) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No wallet address provided and no default wallet address configured.'
                        }],
                        isError: true
                    };
                }

                // If coinType is specified, get the specific balance
                if (coinType) {
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
                } else {
                    // If coinType is not specified, get all balances
                    const balances = await client.getAllBalances({
                        owner: walletAddress
                    });

                    // Format the balances for display
                    const formattedBalances = balances.map(balance => ({
                        coinType: balance.coinType,
                        totalBalance: balance.totalBalance.toString(),
                        // Convert to a more readable format
                        formattedBalance: (Number(balance.totalBalance) / 1_000_000_000).toFixed(9)
                    }));

                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(formattedBalances, null, 2)
                        }]
                    };
                }
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

    // Register the tool for getting all coins
    registration.addTool({
        name: 'sui-get-all-coins',
        description: 'Get all coins for a wallet address',
        args: {
            owner: z.string().optional().describe('The wallet address to get coins for. Uses the default wallet if not specified.'),
            coinType: z.string().optional().describe('The coin type (e.g., "0x2::sui::SUI"). Defaults to SUI if not specified.'),
            limit: z.number().optional().describe('Maximum number of coins to return')
        },
        callback: async ({ owner, coinType, limit }, extra) => {
            try {
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });
                // Resolve the wallet address
                const walletManager = await getDefaultWalletAddress(registration);
                const defaultWallet = walletManager?.getDefaultWallet();
                const walletAddress = owner ?? defaultWallet?.address;

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

    // Register the tool for getting coin metadata
    registration.addTool({
        name: 'sui-get-coin-metadata',
        description: 'Get metadata for a specific coin type',
        args: {
            coinType: z.string().describe('The coin type (e.g., "0x2::sui::SUI")')
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
                        }],
                        isError: true
                    };
                }

                // Format the metadata for display
                const formattedMetadata = {
                    id: metadata.id,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    description: metadata.description,
                    decimals: metadata.decimals,
                    iconUrl: metadata.iconUrl || null,
                };

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(formattedMetadata, null, 2)
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
