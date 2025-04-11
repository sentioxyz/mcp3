import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {AccountManager, getAvailableRewards} from "navi-sdk";

/**
 * Register the rewards tool with the Registration
 * @param registration The Registration instance
 */
export function registerRewardsTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-rewards',
        description: 'Get available rewards for a Sui address in Navi Protocol',
        args: {
            address: z.string().describe('The Sui address to check'),
            options: z.array(z.number()).optional().describe('Optional reward options array')
        },
        callback: async ({address, options = [1]}, extra) => {
            try {
                const account = new AccountManager()
                const rewards = await getAvailableRewards(account.client, address, options, true, true);

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(rewards, null, 2)
                    }]
                };
            } catch (error) {
                console.error('Error fetching rewards:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to fetch rewards: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
