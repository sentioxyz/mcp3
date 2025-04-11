import { Registration } from '@mcp3/common';
import { z } from 'zod';
import { NAVISDKClient, CoinInfo } from 'navi-sdk';

/**
 * Register the pool-info tool with the Registration
 * @param registration The Registration instance
 */
export function registerPoolInfoTool(registration: Registration) {
  registration.addTool({
    name: 'sui-navi-pool-info',
    description: 'Get information about Navi Protocol pools',
    args: {
      symbol: z.string().describe('Optional symbol to filter results (e.g., "SUI", "USDT", "WETH")'),
      address: z.string().describe('Optional coin address to filter results'),
      decimal: z.number().optional().describe('Optional decimal precision for the coin')
    },
    callback: async ({ symbol, address, decimal }, extra) => {
      try {
        const client = new NAVISDKClient({ networkType: 'mainnet' });

        let coinType: CoinInfo | undefined;

        if (symbol || address) {
          coinType = {
            symbol,
            address,
            decimal: decimal || 0,
          };
        }

        const poolInfo = await client.getPoolInfo(coinType);

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
