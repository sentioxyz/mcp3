import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {initCetusSDK} from '@cetusprotocol/cetus-sui-clmm-sdk';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the pool-info tool with the Registration
 * @param registration The Registration instance
 */
export function registerPoolInfoTool(registration: Registration) {


    registration.addTool({
        name: 'sui-cetus-pool-list',
        description: 'List Cetus Protocol pools',
        args: {
            orderBy: z.enum(['tvl', 'vol', 'totalApr', 'fee']).describe('Optional orderBy to filter pools').optional().default("tvl"),
            orderDesc: z.boolean().describe('Optional order to filter pools').optional().default(true),
            allPools: z.boolean().describe('Optional allPools to filter pools').optional().default(false),
            limit: z.number().describe('Optional limit to filter pools').optional(),
            offset: z.number().describe('Optional offset to filter pools').optional(),
        },
        callback: async ({orderBy, limit, orderDesc, offset, allPools}, extra) => {

            // use api from cetus web site
            // https://api-sui.cetus.zone/v2/sui/stats_pools?is_vaults=false&display_all_pools=true&has_mining=true&has_farming=true&no_incentives=true&order_by=tvl&limit=20&offset=

            try {
                const url = new URL('https://api-sui.cetus.zone/v2/sui/stats_pools');
                url.searchParams.set('is_vaults', 'false');
                url.searchParams.set('display_all_pools', "" + allPools);
                url.searchParams.set('has_mining', 'true');
                url.searchParams.set('has_farming', 'true');
                url.searchParams.set('no_incentives', 'true');
                url.searchParams.set('order_by', orderDesc ? "-" + orderBy : orderBy);
                url.searchParams.set('limit', limit?.toString() || '20');
                url.searchParams.set('offset', offset?.toString() || '0');

                const response = await fetch(url.toString());
                const data = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(data)
                    }]
                };
            } catch (error) {
                console.error('Error fetching pool list:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to fetch pool list: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }

        }
    })

    registration.addTool({
        name: 'sui-cetus-pool-info',
        description: 'Get information about Cetus Protocol pool',
        args: {
            poolId: z.string().describe('Optional pool ID to get specific pool information').optional(),
            coinTypeA: z.string().describe('Optional coin type A to filter pools').optional(),
            coinTypeB: z.string().describe('Optional coin type B to filter pools').optional(),
        },
        callback: async ({poolId, coinTypeA, coinTypeB}, extra) => {
            try {
                const sdk = initCetusSDK({
                    network: 'mainnet',
                    fullNodeUrl: registration.globalOptions.nodeUrl
                });

                let result;

                if (poolId) {
                    // Get specific pool
                    result = await sdk.Pool.getPool(poolId);
                } else if (coinTypeA && coinTypeB) {
                    // Get pool by coin types
                    result = await sdk.Pool.getPoolByCoins([coinTypeA, coinTypeB]);
                } else {
                    throw new Error('Either poolId or both coinTypeA and coinTypeB must be provided');
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
                };
            } catch (error) {
                console.error('Error fetching pool info:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to fetch pool info: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
