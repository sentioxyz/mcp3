import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

/**
 * Register the APR tool with the Registration
 * @param registration The Registration instance
 */
export function registerAprTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-apr',
    description: 'Calculate APR for a pool or position in Cetus Protocol',
    args: {
      poolId: z.string().describe('The pool ID to check APR for').optional(),
      positionId: z.string().describe('The position ID to check APR for').optional()
    },
    callback: async ({poolId, positionId}, extra) => {
      try {
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        if (!poolId && !positionId) {
          return {
            content: [{
              type: 'text',
              text: 'Either poolId or positionId must be provided'
            }],
            isError: true
          };
        }

        let result;

        if (positionId) {
          // Get position APR
          const position = await sdk.Position.getPositionById(positionId);
          const pool = await sdk.Pool.getPool(position.pool);

          // Calculate estimated APR based on pool data
          // This is a simplified calculation
          const poolFeeRate = Number(pool.fee_rate) / 1000000;
          const estimatedApr = poolFeeRate * 365 * 100; // Simple estimation

          result = {
            type: 'position',
            id: positionId,
            pool: position.pool,
            apr: {
              feeApr: estimatedApr,
              rewardAprs: [],
              totalApr: estimatedApr
            }
          };
        } else if (poolId) {
          // Get pool APR
          const pool = await sdk.Pool.getPool(poolId);

          // Calculate estimated APR based on pool data
          // This is a simplified calculation
          const poolFeeRate = Number(pool.fee_rate) / 1000000;
          const estimatedApr = poolFeeRate * 365 * 100; // Simple estimation

          result = {
            type: 'pool',
            id: poolId,
            name: pool.name,
            apr: {
              feeApr: estimatedApr,
              rewardAprs: [],
              totalApr: estimatedApr
            }
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error calculating APR:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to calculate APR: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
