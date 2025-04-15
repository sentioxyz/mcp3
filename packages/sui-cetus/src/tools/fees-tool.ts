import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

/**
 * Register the fees tool with the Registration
 * @param registration The Registration instance
 */
export function registerFeesTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-fees',
    description: 'Calculate fees for a position in Cetus Protocol',
    args: {
      positionId: z.string().describe('The position ID to check fees for')
    },
    callback: async ({positionId}, extra) => {
      try {
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        // Get position information
        const position = await sdk.Position.getPositionById(positionId);

        // Get pool information
        const pool = await sdk.Pool.getPool(position.pool);

        // Get fees from position
        const fees = {
          feeOwedA: position.fee_owed_a || '0',
          feeOwedB: position.fee_owed_b || '0'
        };

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              position: {
                id: positionId,
                owner: position.owner,
                pool: position.pool
              },
              fees: {
                feeA: fees.feeOwedA.toString(),
                feeB: fees.feeOwedB.toString()
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error calculating fees:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to calculate fees: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
