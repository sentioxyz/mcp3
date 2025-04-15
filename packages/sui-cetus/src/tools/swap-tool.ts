import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK, adjustForSlippage, d, Percentage } from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';

/**
 * Register the swap tool with the Registration
 * @param registration The Registration instance
 */
export function registerSwapTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-swap-quote',
    description: 'Get a quote for swapping tokens using Cetus Protocol',
    args: {
      poolId: z.string().describe('The pool ID to use for the swap'),
      a2b: z.string().describe('Whether to swap from coin A to coin B (true) or B to A (false)'),
      byAmountIn: z.string().describe('Whether to fix the input amount (true) or output amount (false)'),
      amount: z.string().describe('The amount to swap (as a string to handle large numbers)'),
      slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5)
    },
    callback: async ({poolId, a2b, byAmountIn, amount, slippage}, extra) => {
      // Convert string values to booleans
      const a2bBool = a2b === 'true';
      const byAmountInBool = byAmountIn === 'true';
      try {
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        // Get pool information
        const pool = await sdk.Pool.getPool(poolId);

        // Convert amount to BN
        const amountBN = new BN(amount);

        // Calculate slippage percentage
        const slippagePercentage = Percentage.fromDecimal(d(slippage));

        // Perform preswap calculation
        const preswapResult = await sdk.Swap.preswap({
          pool: pool,
          currentSqrtPrice: pool.current_sqrt_price,
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          decimalsA: 9, // This should be dynamically determined based on the coin
          decimalsB: 9, // This should be dynamically determined based on the coin
          a2b: a2bBool,
          byAmountIn: byAmountInBool,
          amount: amountBN,
        });

        // Check if preswap calculation was successful
        if (!preswapResult) {
          throw new Error('Failed to calculate swap quote');
        }

        // Calculate amount limit with slippage
        // We need to ensure toAmount is a BN object
        const toAmountStr = byAmountInBool ? preswapResult.estimatedAmountOut : preswapResult.estimatedAmountIn;
        const toAmount = new BN(toAmountStr);
        const amountLimit = adjustForSlippage(toAmount, slippagePercentage, !byAmountInBool);

        const result = {
          pool: {
            id: pool.poolAddress,
            name: pool.name,
            coinTypeA: pool.coinTypeA,
            coinTypeB: pool.coinTypeB,
          },
          swap: {
            a2b: a2bBool,
            byAmountIn: byAmountInBool,
            amount: amount,
            estimatedAmountIn: preswapResult.estimatedAmountIn.toString(),
            estimatedAmountOut: preswapResult.estimatedAmountOut.toString(),
            amountLimit: amountLimit.toString(),
            estimatedFeeAmount: preswapResult.estimatedFeeAmount.toString(),
            priceImpact: '0' // Price impact is not directly available in the API
          }
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error calculating swap quote:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to calculate swap quote: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
