import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {AccountManager} from 'navi-sdk';

/**
 * Register the portfolio tool with the Registration
 * @param registration The Registration instance
 */
export function registerPortfolioTool(registration: Registration) {
  registration.addTool({
    name: 'sui-navi-portfolio',
    description: 'Get the Navi Protocol portfolio for a Sui address',
    args: {
      address: z.string().describe('The Sui address to check')
    },
    callback: async ({ address }, extra) => {
      try {

        const account = new AccountManager()
        account.address = address
        const portfolio = await account.getNAVIPortfolio(address);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(portfolio, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to fetch portfolio: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
