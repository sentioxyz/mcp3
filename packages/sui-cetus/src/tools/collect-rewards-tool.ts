import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {initCetusSDK} from '@cetusprotocol/cetus-sui-clmm-sdk';
import {SuiClient} from '@mysten/sui/client';
import {transactionToResource} from '@mcp3/sui-base';

/**
 * Register the collect rewards tool with the Registration
 * @param registration The Registration instance
 */
export function registerCollectRewardsTool(registration: Registration) {
    registration.addTool({
        name: 'sui-cetus-collect-rewards',
        description: 'Collect rewards from a position in Cetus Protocol',
        args: {
            positionId: z.string().describe('The position ID to collect rewards from'),
            collectFees: z.boolean().describe('Whether to also collect fees').default(false),
            walletAddress: z.string().describe('The wallet address to use')
        },
        callback: async ({positionId, collectFees, walletAddress}, extra) => {
            try {
                // Initialize the Cetus SDK
                const sdk = initCetusSDK({
                    network: 'mainnet',
                    fullNodeUrl: registration.globalOptions.nodeUrl
                });

                const sender: string = walletAddress;
                sdk.senderAddress = sender;
                // Get position information
                const position = await sdk.Position.getPositionById(positionId);

                // Get pool information
                const pool = await sdk.Pool.getPool(position.pool);

                // Get all rewards for the position
                const rewards = await sdk.Rewarder.sdk.Rewarder.posRewardersAmount(
                    pool.poolAddress,
                    pool.position_manager.positions_handle,
                    positionId
                );
                const rewardCoinTypes = rewards
                    .filter(item => Number(item.amount_owed) > 0)
                    .map(item => item.coin_address);

                // If there are no rewards to collect, inform the user
                if (rewardCoinTypes.length === 0) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'No rewards available to collect for this position.'
                        }]
                    };
                }

                // Build collect rewards params
                const collectRewardsParams = {
                    pool_id: pool.poolAddress,
                    pos_id: positionId,
                    rewarder_coin_types: rewardCoinTypes,
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    collect_fee: collectFees
                };

                // Create collect rewards transaction payload
                const collectRewardsTransactionPayload = await sdk.Rewarder.collectRewarderTransactionPayload(
                    collectRewardsParams
                );

                // Create SUI client
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});

                // Set sender
                collectRewardsTransactionPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(collectRewardsTransactionPayload, client),
                    }]
                };
            } catch (error) {
                console.error('Error collecting rewards:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to collect rewards: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
