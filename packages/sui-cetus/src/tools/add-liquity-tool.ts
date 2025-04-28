import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {
    AddLiquidityFixTokenParams,
    adjustForCoinSlippage,
    ClmmPoolUtil,
    initCetusSDK,
    Percentage,
    TickMath
} from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';
import {SuiClient} from '@mysten/sui/client';
import {transactionToResource} from '@mcp3/sui-base';

/**
 * Register the add liquidity tools with the Registration
 * @param registration The Registration instance
 */
export function registerAddLiquidityTools(registration: Registration) {
    registration.addTool({
        name: 'sui-cetus-add-liquidity-by-value',
        description: 'Add liquidity with a specified liquidity value to a Cetus Protocol pool',
        args: {
            poolId: z.string().describe('The pool ID to add liquidity to'),
            tickLower: z.string().optional().describe('The lower tick boundary (optional, will use current tick - tickSpacing if not provided)'),
            tickUpper: z.string().optional().describe('The upper tick boundary (optional, will use current tick + tickSpacing if not provided)'),
            totalAmount: z.string().describe('The total amount to add as liquidity'),
            slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5),
            collectFee: z.boolean().describe('Whether to collect fees while adding liquidity').default(false),
            walletAddress: z.string().describe('The wallet address to use')
        },
        callback: async ({poolId, tickLower, tickUpper, totalAmount, slippage, collectFee, walletAddress}, extra) => {
            try {
                // Initialize the Cetus SDK
                const sdk = initCetusSDK({
                    network: 'mainnet',
                    fullNodeUrl: registration.globalOptions.nodeUrl
                });

                const sender: string = walletAddress;
                sdk.senderAddress = sender
                // Get pool information
                const pool = await sdk.Pool.getPool(poolId);

                // Determine tick boundaries if not provided
                let lowerTickValue: number;
                let upperTickValue: number;

                if (tickLower && tickUpper) {
                    lowerTickValue = parseInt(tickLower);
                    upperTickValue = parseInt(tickUpper);
                } else {
                    // Calculate tick boundaries based on current tick and tick spacing
                    const currentTick = new BN(pool.current_tick_index).toNumber();
                    const tickSpacing = new BN(pool.tickSpacing).toNumber();

                    lowerTickValue = TickMath.getPrevInitializableTickIndex(
                        currentTick,
                        tickSpacing
                    );

                    upperTickValue = TickMath.getNextInitializableTickIndex(
                        currentTick,
                        tickSpacing
                    );
                }

                // Get current sqrt price
                const curSqrtPrice = new BN(pool.current_sqrt_price);

                // Calculate token prices (simplified for demonstration)
                // In a real implementation, you might want to get actual token prices
                const tokenPriceA = '1'; // Placeholder
                const tokenPriceB = '1'; // Placeholder

                // Estimate coin amounts from total amount
                const coinAmounts = ClmmPoolUtil.estCoinAmountsFromTotalAmount(
                    lowerTickValue,
                    upperTickValue,
                    curSqrtPrice,
                    totalAmount,
                    tokenPriceA,
                    tokenPriceB
                );

                // Convert to BN amounts
                // Note: In a real implementation, you would need to handle decimals properly
                const amountA = new BN(coinAmounts.amountA.toString());
                const amountB = new BN(coinAmounts.amountB.toString());

                const tokenAmounts = {
                    coinA: amountA,
                    coinB: amountB,
                };

                // Estimate liquidity from coin amounts
                const liquidity = ClmmPoolUtil.estimateLiquidityFromcoinAmounts(
                    curSqrtPrice,
                    lowerTickValue,
                    upperTickValue,
                    tokenAmounts
                );

                // Apply slippage tolerance
                const {tokenMaxA, tokenMaxB} = adjustForCoinSlippage(tokenAmounts,
                    Percentage.fromFraction(new BN(slippage), new BN(100)), true);

                // Build add liquidity payload params
                const addLiquidityPayloadParams = {
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    pool_id: poolId,
                    tick_lower: lowerTickValue.toString(),
                    tick_upper: upperTickValue.toString(),
                    delta_liquidity: liquidity.toString(),
                    max_amount_a: tokenMaxA.toString(),
                    max_amount_b: tokenMaxB.toString(),
                    pos_id: '', // No position ID since we're creating a new one
                    rewarder_coin_types: [],
                    collect_fee: collectFee,
                };

                // Create add liquidity transaction payload
                const createAddLiquidityPayload = await sdk.Position.createAddLiquidityPayload(
                    addLiquidityPayloadParams
                );

                // Create SUI client
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});

                // Set sender
                createAddLiquidityPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(createAddLiquidityPayload, client),
                    }]
                };
            } catch (error) {
                console.error('Error adding liquidity by value:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to add liquidity by value: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });

    registration.addTool({
        name: 'sui-cetus-add-liquidity-by-coin',
        description: 'Add liquidity with a fixed coin amount to a Cetus Protocol pool',
        args: {
            poolId: z.string().describe('The pool ID to add liquidity to'),
            tickLower: z.string().optional().describe('The lower tick boundary (optional, will use current tick - tickSpacing if not provided)'),
            tickUpper: z.string().optional().describe('The upper tick boundary (optional, will use current tick + tickSpacing if not provided)'),
            fixAmountA: z.boolean().describe('Whether to fix the amount of coin A (true) or coin B (false)').default(true),
            amount: z.string().describe('The amount of coin to add (fixed coin A or B based on fixAmountA)'),
            slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5),
            isOpen: z.boolean().describe('Whether to open a new position (true) or add to existing (false)').default(true),
            positionId: z.string().optional().describe('The position ID to add liquidity to (required if isOpen is false)'),
            collectFee: z.boolean().describe('Whether to collect fees while adding liquidity').default(false),
            walletAddress: z.string().describe('The wallet address to use')
        },
        callback: async ({poolId, tickLower, tickUpper, fixAmountA, amount, slippage, isOpen, positionId, collectFee, walletAddress}, extra) => {
            try {
                // Initialize the Cetus SDK
                const sdk = initCetusSDK({
                    network: 'mainnet',
                    fullNodeUrl: registration.globalOptions.nodeUrl
                });

                const sender: string = walletAddress;
                sdk.senderAddress = sender

                // Get pool information
                const pool = await sdk.Pool.getPool(poolId);

                // Determine tick boundaries if not provided
                let lowerTickValue: number;
                let upperTickValue: number;

                if (tickLower && tickUpper) {
                    lowerTickValue = parseInt(tickLower);
                    upperTickValue = parseInt(tickUpper);
                } else {
                    // Calculate tick boundaries based on current tick and tick spacing
                    const currentTick = new BN(pool.current_tick_index).toNumber();
                    const tickSpacing = new BN(pool.tickSpacing).toNumber();

                    lowerTickValue = TickMath.getPrevInitializableTickIndex(
                        currentTick,
                        tickSpacing
                    );

                    upperTickValue = TickMath.getNextInitializableTickIndex(
                        currentTick,
                        tickSpacing
                    );
                }

                // Convert amount to BN
                const coinAmount = new BN(amount);

                // Get current sqrt price
                const curSqrtPrice = new BN(pool.current_sqrt_price);

                // Calculate liquidity and coin amounts
                const liquidityInput = ClmmPoolUtil.estLiquidityAndcoinAmountFromOneAmounts(
                    lowerTickValue,
                    upperTickValue,
                    coinAmount,
                    fixAmountA,
                    true,
                    slippage / 100, // Convert from percentage to decimal
                    curSqrtPrice
                );

                // Determine amounts based on fixed amount
                const amountA = fixAmountA ? coinAmount.toNumber() : liquidityInput.tokenMaxA.toNumber();
                const amountB = fixAmountA ? liquidityInput.tokenMaxB.toNumber() : coinAmount.toNumber();

                // Check if we need to validate position ID
                if (!isOpen && !positionId) {
                    return {
                        content: [{
                            type: 'text',
                            text: 'Position ID is required when adding liquidity to an existing position.'
                        }],
                        isError: true
                    };
                }

                // Build add liquidity payload params
                const addLiquidityPayloadParams: AddLiquidityFixTokenParams = {
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    pool_id: poolId,
                    tick_lower: lowerTickValue.toString(),
                    tick_upper: upperTickValue.toString(),
                    fix_amount_a: fixAmountA,
                    amount_a: amountA,
                    amount_b: amountB,
                    slippage: slippage / 100, // Convert from percentage to decimal
                    is_open: isOpen,
                    rewarder_coin_types: [],
                    collect_fee: collectFee,
                    pos_id: isOpen ? '' : positionId ?? '',
                };

                // Create add liquidity transaction payload
                const createAddLiquidityTransactionPayload = await sdk.Position.createAddLiquidityFixTokenPayload(
                    addLiquidityPayloadParams,
                    {
                        slippage: slippage / 100,
                        curSqrtPrice: curSqrtPrice,
                    }
                );

                // Create SUI client
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});

                // Set sender
                createAddLiquidityTransactionPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(createAddLiquidityTransactionPayload, client),
                    }]
                };
            } catch (error) {
                console.error('Error adding liquidity by coin:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to add liquidity by coin: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
