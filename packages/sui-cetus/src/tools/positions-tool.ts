import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the positions tool with the Registration
 * @param registration The Registration instance
 */
export function registerPositionsTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-positions',
    description: 'Get positions for a Sui address in Cetus Protocol',
    args: {
      address: z.string().describe('The Sui address to check'),
      positionId: z.string().describe('Optional position ID to get specific position information').optional()
    },
    callback: async ({address, positionId}, extra) => {
      try {
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        let result;

        if (positionId) {
          // Get specific position
          result = await sdk.Position.getPositionById(positionId);
        } else {
          // Get all positions for address
          result = await sdk.Position.getPositionList(address);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error fetching positions:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to fetch positions: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
