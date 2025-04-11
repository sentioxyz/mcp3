import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {Dex, getQuote} from "navi-sdk";

/**
 * Register the swap-quote tool with the Registration
 * @param registration The Registration instance
 */
export function registerSwapQuoteTool(registration: Registration) {
  registration.addTool({
    name: 'sui-navi-swap-quote',
    description: 'Get a quote for swapping tokens using Navi Protocol',
    args: {
      fromCoinAddress: z.string().describe('The address of the coin to swap from'),
      toCoinAddress: z.string().describe('The address of the coin to swap to'),
      amountIn: z.string().describe('The amount to swap (as a string to handle large numbers)'),
      apiKey: z.string().optional().describe('Optional API key for the swap service'),
      dexList: z.array(z.string()).optional().describe('Optional list of DEXes to use for the swap'),
      byAmountIn: z.boolean().optional().describe('Whether to calculate by amount in (true) or amount out (false)'),
      depth: z.number().optional().describe('The depth of the search for swap routes')
    },
    callback: async ({ fromCoinAddress, toCoinAddress, amountIn, apiKey, dexList = [], byAmountIn = true, depth = 3 }, extra) => {
      try {

        const swapOptions = {
          baseUrl: undefined,
          dexList: dexList as Dex[],
          byAmountIn,
          depth,
        };



        const quote = await getQuote(
          fromCoinAddress,
          toCoinAddress,
          amountIn,
          apiKey,
          swapOptions
        );

        const result = {
          quote,
          fromCoinAddress,
          toCoinAddress,
          amountIn,
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error fetching swap quote:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to fetch swap quote: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
