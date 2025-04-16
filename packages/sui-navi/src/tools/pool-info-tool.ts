import { Registration } from '@mcp3/common';
import { z } from 'zod';
import { CoinInfo, getPoolInfo } from 'navi-sdk';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the pool-info tool with the Registration
 * @param registration The Registration instance
 */
export function registerPoolInfoTool(registration: Registration) {
  registration.addTool({
    name: 'sui-navi-pool-info',
    description: 'Get information about Navi Protocol pools',
    args: {
      symbol: z.string().describe('Optional symbol to filter results (e.g., "SUI", "USDT", "WETH")').optional(),
      address: z.string().describe('Optional coin address to filter results').optional(),
      decimal: z.number().optional().describe('Optional decimal precision for the coin')
    },
    callback: async ({ symbol, address, decimal }, extra) => {
      try {
        const suiClient = new SuiClient({url: registration.globalOptions.nodeUrl});

        let coinType: CoinInfo | undefined;

        if (symbol && address) {
          coinType = {
            symbol,
            address,
            decimal: decimal || 0,
          };
        }

        // @ts-ignore
        const poolInfo = await getPoolInfo(coinType, suiClient);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(poolInfo)
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
