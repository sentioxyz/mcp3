import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the pool-info tool with the Registration
 * @param registration The Registration instance
 */
export function registerPoolInfoTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-pool-info',
    description: 'Get information about Cetus Protocol pools',
    args: {
      poolId: z.string().describe('Optional pool ID to get specific pool information').optional(),
      coinTypeA: z.string().describe('Optional coin type A to filter pools').optional(),
      coinTypeB: z.string().describe('Optional coin type B to filter pools').optional()
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
          // Get all pools
          result = await sdk.Pool.getPoolsWithPage([]);
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
