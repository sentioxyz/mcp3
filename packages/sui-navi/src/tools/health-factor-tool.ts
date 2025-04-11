import { Registration } from '@mcp3/common';
import { z } from 'zod';
import {NAVISDKClient, CoinInfo, AccountManager} from 'navi-sdk';

/**
 * Register the health-factor tool with the Registration
 * @param registration The Registration instance
 */
export function registerHealthFactorTool(registration: Registration) {
  registration.addTool({
    name: 'sui-navi-health-factor',
    description: 'Get the health factor for a Sui address in Navi Protocol',
    args: {
      address: z.string().describe('The Sui address to check')
    },
    callback: async ({ address }, extra) => {
      try {
        const account = new AccountManager()
        account.address = address
        const healthFactor = await account.getHealthFactor(address);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(healthFactor, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error fetching health factor:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to fetch health factor: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
