import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SuiClient } from '@mysten/sui/client';

/**
 * Register the sui-get-balance tool with the MCP server
 * @param server The MCP server instance
 * @param nodeUrl The Sui RPC URL
 */
export function registerBalanceTool(server: McpServer, nodeUrl: string) {
    // Register the tool for getting a specific coin balance
    server.tool(
        'sui-get-balance',
        {
            owner: z.string().describe('The wallet address to get the balance for'),
            coinType: z.string().optional().describe('The coin type (e.g., "0x2::sui::SUI"). Defaults to SUI if not specified.')
        },
        async ({ owner, coinType }) => {
            try {
                const client = new SuiClient({ url: nodeUrl });
                const balance = await client.getBalance({
                    owner,
                    coinType: coinType || null
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
    );

    // Register the tool for getting all coin balances
    server.tool(
        'sui-get-all-balances',
        {
            owner: z.string().describe('The wallet address to get all balances for')
        },
        async ({ owner }) => {
            try {
                const client = new SuiClient({ url: nodeUrl });
                const balances = await client.getAllBalances({
                    owner
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
    );

    // Register the tool for getting all coins
    server.tool(
        'sui-get-all-coins',
        {
            owner: z.string().describe('The wallet address to get coins for'),
            coinType: z.string().optional().describe('The coin type (e.g., "0x2::sui::SUI"). Defaults to SUI if not specified.'),
            limit: z.number().optional().describe('Maximum number of coins to return')
        },
        async ({ owner, coinType, limit }) => {
            try {
                const client = new SuiClient({ url: nodeUrl });
                const coins = await client.getAllCoins({
                    owner,
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
    );

    // Register the tool for getting coin metadata
    server.tool(
        'sui-get-coin-metadata',
        {
            coinType: z.string().describe('The coin type (e.g., "0x2::sui::SUI")')
        },
        async ({ coinType }) => {
            try {
                const client = new SuiClient({ url: nodeUrl });
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
    );
}
