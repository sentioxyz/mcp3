import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {ClmmPoolUtil, initCetusSDK, TickMath} from '@cetusprotocol/cetus-sui-clmm-sdk';
// @ts-ignore
import BN from 'bn.js';
import {SuiClient} from '@mysten/sui/client';
import {getWalletManager, resolveWalletAddressOrThrow, transactionToResource} from '@mcp3/sui-base';


/**
 * Register the open-position-only tool with the Registration
 * @param registration The Registration instance
 */
export function registerOpenPositionTools(registration: Registration) {
  registration.addTool({
    name: 'sui-cetus-open-position-only',
    description: 'Open a position in Cetus Protocol without adding liquidity',
    args: {
      poolId: z.string().describe('The pool ID to open a position in'),
      tickLower: z.string().optional().describe('The lower tick boundary (optional, will use current tick - tickSpacing if not provided)'),
      tickUpper: z.string().optional().describe('The upper tick boundary (optional, will use current tick + tickSpacing if not provided)'),
      walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)')
    },
    callback: async ({poolId, tickLower, tickUpper, walletAddress}, extra) => {
      try {
        // Initialize the Cetus SDK
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        // Get a wallet manager
        const walletManager = await getWalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        const sender: string = await resolveWalletAddressOrThrow(walletAddress);

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

        // Build open position payload
        const openPositionPayload = sdk.Position.openPositionTransactionPayload({
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          tick_lower: lowerTickValue.toString(),
          tick_upper: upperTickValue.toString(),
          pool_id: pool.poolAddress,
        });

        // Create SUI client
        const client = new SuiClient({url: registration.globalOptions.nodeUrl});

        openPositionPayload.setSender(sender);

        return {
          content: [{
            type: 'resource',
            // @ts-ignore
            resource: await transactionToResource(openPositionPayload, client),
          }]
        };
      } catch (error) {
        console.error('Error opening position:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to open position: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  });
  registration.addTool({
    name: 'sui-cetus-open-position-with-add-liquidity',
    description: 'Open a position and add liquidity in Cetus Protocol',
    args: {
      poolId: z.string().describe('The pool ID to open a position in'),
      tickLower: z.string().optional().describe('The lower tick boundary (optional, will use current tick - tickSpacing if not provided)'),
      tickUpper: z.string().optional().describe('The upper tick boundary (optional, will use current tick + tickSpacing if not provided)'),
      fixAmountA: z.boolean().describe('Whether to fix the amount of coin A (true) or coin B (false)').default(true),
      amount: z.string().describe('The amount of coin to add (fixed coin A or B based on fixAmountA)'),
      slippage: z.number().describe('The slippage tolerance percentage (e.g., 0.5 for 0.5%)').default(0.5),
      collectFee: z.boolean().describe('Whether to collect fees (only applicable if adding to an existing position)').default(false),
      walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)')
    },
    callback: async ({poolId, tickLower, tickUpper, fixAmountA, amount, slippage, collectFee, walletAddress}, extra) => {
      try {
        // Initialize the Cetus SDK
        const sdk = initCetusSDK({
          network: 'mainnet',
          fullNodeUrl: registration.globalOptions.nodeUrl
        });

        // Get a wallet manager
        const walletManager = await getWalletManager({
          nodeUrl: registration.globalOptions.nodeUrl,
          walletConfig: registration.globalOptions.walletConfig
        });

        let sender: string;
        if (walletAddress) {
          sender = walletManager?.getWallet(walletAddress)?.address ?? walletAddress;
        } else {
          sender = walletManager?.getDefaultWallet()?.address ?? '';
        }

        if (!sender) {
          return {
            content: [{
              type: 'text',
              text: 'No wallet address provided and no default wallet address configured.'
            }],
            isError: true
          };
        }

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

        // Build add liquidity payload params
        const addLiquidityPayloadParams = {
          coinTypeA: pool.coinTypeA,
          coinTypeB: pool.coinTypeB,
          pool_id: poolId,
          tick_lower: lowerTickValue.toString(),
          tick_upper: upperTickValue.toString(),
          fix_amount_a: fixAmountA,
          amount_a: amountA,
          amount_b: amountB,
          slippage: slippage / 100, // Convert from percentage to decimal
          is_open: true, // This is a new position
          rewarder_coin_types: [],
          collect_fee: collectFee,
          pos_id: '', // No position ID since we're creating a new one
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
        console.error('Error opening position with add liquidity:', error);
        return {
          content: [{
            type: 'text',
            text: `Failed to open position with add liquidity: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    },
  })

}
