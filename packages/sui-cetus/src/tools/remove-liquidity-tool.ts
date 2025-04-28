import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {
    adjustForCoinSlippage,
    ClmmPoolUtil,
    initCetusSDK,
    Percentage,
    TickMath
} from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';
import {transactionToResource} from '@mcp3/sui-base';

/**
 * Register the remove liquidity tool with the Registration
 * @param registration The Registration instance
 */
export function registerRemoveLiquidityTool(registration: Registration) {
    registration.addTool({
        name: 'sui-cetus-remove-liquidity',
        description: 'Remove liquidity from a position in Cetus Protocol',
        args: {
            positionId: z.string().describe('The position ID to remove liquidity from'),
            liquidity: z.string().describe('The amount of liquidity to remove (as a string to handle large numbers)'),
            slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5),
            collectFee: z.boolean().describe('Whether to collect fees while removing liquidity').default(true),
            collectRewards: z.boolean().describe('Whether to collect rewards while removing liquidity').default(true),
            walletAddress: z.string().describe('The wallet address to use')
        },
        callback: async ({positionId, liquidity, slippage, collectFee, collectRewards, walletAddress}, extra) => {
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

                // Convert liquidity to BN
                const liquidityBN = new BN(liquidity);

                // Get current sqrt price
                const curSqrtPrice = new BN(pool.current_sqrt_price);

                // Get tick data
                const lowerSqrtPrice = TickMath.tickIndexToSqrtPriceX64(position.tick_lower_index);
                const upperSqrtPrice = TickMath.tickIndexToSqrtPriceX64(position.tick_upper_index);

                // Get coin amounts from liquidity
                const coinAmounts = ClmmPoolUtil.getCoinAmountFromLiquidity(
                    liquidityBN,
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
                let rewarderCoinTypes: string[] = [];
                if (collectRewards) {
                    // Get all rewards for the position
                    const rewards = await sdk.Rewarder.sdk.Rewarder.posRewardersAmount(
                        pool.poolAddress,
                        pool.position_manager.positions_handle,
                        positionId
                    );
                    rewarderCoinTypes = rewards
                        .filter(item => Number(item.amount_owed) > 0)
                        .map(item => item.coin_address);
                }

                // Build remove liquidity params
                const removeLiquidityParams = {
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    delta_liquidity: liquidityBN.toString(),
                    min_amount_a: tokenMaxA.toString(),
                    min_amount_b: tokenMaxB.toString(),
                    pool_id: pool.poolAddress,
                    pos_id: positionId,
                    collect_fee: collectFee,
                    rewarder_coin_types: rewarderCoinTypes
                };

                // Create remove liquidity transaction payload
                const removeLiquidityTransactionPayload = await sdk.Position.removeLiquidityTransactionPayload(
                    removeLiquidityParams
                );

                // Set sender
                removeLiquidityTransactionPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(removeLiquidityTransactionPayload, sdk.fullClient),
                    }]
                };
            } catch (error) {
                console.error('Error removing liquidity:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to remove liquidity: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
