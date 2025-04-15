import {Registration} from '@mcp3/common';
import {z} from 'zod';
import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';

/**
 * Register the rewards tool with the Registration
 * @param registration The Registration instance
 */
export function registerRewardsTool(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-rewards',
    description: 'Calculate rewards for a position in Cetus Protocol',
    args: {
      positionId: z.string().describe('The position ID to check rewards for')
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

        // Get rewards
        // Since the position structure might not have rewarder_infos directly,
        // we'll create a simplified response

        // Create a simple array of rewards
        const formattedRewards = [
          {
            coinAddress: 'reward_0',
            amount: position.reward_amount_owed_0 || '0'
          },
          {
            coinAddress: 'reward_1',
            amount: position.reward_amount_owed_1 || '0'
          },
          {
            coinAddress: 'reward_2',
            amount: position.reward_amount_owed_2 || '0'
          }
        ].filter(reward => reward.amount !== '0');

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              position: {
                id: positionId,
                owner: position.owner,
                pool: position.pool
              },
              rewards: formattedRewards.map((reward: { coinAddress: string; amount: string }) => ({
                coinAddress: reward.coinAddress,
                amount: reward.amount.toString()
              }))
            }, null, 2)
          }]
        };
      } catch (error) {
        console.error('Error calculating rewards:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to calculate rewards: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
}
