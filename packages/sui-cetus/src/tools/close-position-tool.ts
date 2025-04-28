import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {
    adjustForCoinSlippage,
    ClmmPoolUtil,
    ClosePositionParams,
    initCetusSDK,
    Percentage,
    TickMath
} from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';
import {SuiClient} from '@mysten/sui/client';
import {transactionToResource} from '@mcp3/sui-base';

/**
 * Register the close position tool with the Registration
 * @param registration The Registration instance
 */
export function registerClosePositionTool(registration: Registration) {
    registration.addTool({
        name: 'sui-cetus-close-position',
        description: 'Close a position in Cetus Protocol (withdraws all liquidity, fees, and rewards)',
        args: {
            positionId: z.string().describe('The position ID to close'),
            slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5),
            walletAddress: z.string().describe('The wallet address to use'),
            collect_fee: z.boolean().optional().default(false).describe('Collect fee while closing the position'),
            collect_rewards: z.boolean().optional().default(true).describe('Collect rewards while closing the position')
        },
        callback: async ({positionId, slippage, collect_rewards, walletAddress, collect_fee}, extra) => {
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

                // Get the full liquidity amount
                const liquidity = new BN(position.liquidity);

                // Get tick data
                const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(position.tick_lower_index);
                const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(position.tick_upper_index);

                // Get current sqrt price
                const curSqrtPrice = new BN(pool.current_sqrt_price);

                // Get coin amounts from liquidity
                const coinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
                    liquidity,
                    curSqrtPrice,
                    lowerSqrtPrice,
                    upperSqrtPrice,
                    false
                );

                // Apply slippage tolerance for minimum amounts
                const slippagePercentage = new Percentage(new BN(slippage), new BN(100));
                const {tokenMaxA, tokenMaxB} = adjustForCoinSlippage(
                    coinAmounts,
                    slippagePercentage,
                    false
                );

                let rewardCoinTypes: string[] = []
                if (collect_rewards) {
                    // Get all rewards for the position
                    const rewards = await sdk.Rewarder.sdk.Rewarder.posRewardersAmount(
                        pool.poolAddress,
                        pool.position_manager.positions_handle,
                        positionId
                    );
                    rewardCoinTypes = rewards
                        .filter(item => Number(item.amount_owed) > 0)
                        .map(item => item.coin_address);
                }

                // Build close position params
                const closePositionParams: ClosePositionParams = {
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    min_amount_a: tokenMaxA.toString(),
                    min_amount_b: tokenMaxB.toString(),
                    rewarder_coin_types: rewardCoinTypes,
                    pool_id: pool.poolAddress,
                    pos_id: positionId,
                    collect_fee
                };

                // Create close position transaction payload
                const closePositionTransactionPayload = await sdk.Position.closePositionTransactionPayload(
                    closePositionParams
                );

                // Create SUI client
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});

                // Set sender
                closePositionTransactionPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(closePositionTransactionPayload, client),
                    }]
                };
            } catch (error) {
                console.error('Error closing position:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to close position: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
