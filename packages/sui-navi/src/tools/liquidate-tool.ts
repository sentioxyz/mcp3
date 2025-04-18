import {z} from 'zod';
import {Registration} from "@mcp3/common";
import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {resolveWalletAddressOrThrow, transactionToResource} from '@mcp3/sui-base';
import {liquidateFunction, updateOraclePTB} from 'navi-sdk'
import {getCoinInfo} from "../coin_info.js";

/**
 * Register the liquidate tool with the Registration
 * @param registration The Registration instance
 */
export function registerLiquidateTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-liquidate',
        description: 'Liquidate an undercollateralized position in Navi Protocol',
        args: {
            payCoinType: z.string().describe('The coin type to pay for liquidation (e.g., "Sui", "USDC", "USDT")'),
            liquidationAddress: z.string().describe('The address of the position to liquidate'),
            collateralCoinType: z.string().describe('The coin type to receive as collateral (e.g., "Sui", "USDC", "USDT")'),
            liquidationAmount: z.number().optional().default(0).describe('The amount to liquidate (0 means use all available balance)'),
            walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)'),
            updateOracle: z.boolean().optional().default(true).describe('Whether to update the oracle before liquidation (default: true)')
        },
        callback: async ({payCoinType, liquidationAddress, collateralCoinType, liquidationAmount, walletAddress, updateOracle}, extra) => {
            try {
                const sender = await resolveWalletAddressOrThrow(walletAddress);

                const payCoinInfo = getCoinInfo(payCoinType);
                if (!payCoinInfo) {
                    throw new Error("Not supported coin " + payCoinType);
                }

                const collateralCoinInfo = getCoinInfo(collateralCoinType);
                if (!collateralCoinInfo) {
                    throw new Error("Not supported coin " + collateralCoinType);
                }

                // Get coin metadata to determine decimals
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});
                const payMetadata = await client.getCoinMetadata({
                    coinType: payCoinInfo.address
                });
                const collateralMetadata = await client.getCoinMetadata({
                    coinType: collateralCoinInfo.address
                });

                // Default to 9 decimals (like SUI) if metadata is not available
                const payDecimals = payMetadata?.decimals ?? 9;
                const collateralDecimals = collateralMetadata?.decimals ?? 9;

                // Create transaction block
                const txb = new Transaction()
                txb.setSender(sender)

                // Update oracle if requested
                if (updateOracle) {
                    // @ts-ignore
                    await updateOraclePTB(client, txb);
                }

                // Get the coins owned by the sender
                const coins = await client.getCoins({
                    owner: sender,
                    coinType: payCoinInfo.address
                });

                if (!coins.data.length) {
                    throw new Error("Insufficient balance for this Coin");
                }

                // Get total balance
                const allBalance = await client.getBalance({
                    owner: sender,
                    coinType: payCoinInfo.address
                });
                let totalBalance = allBalance.totalBalance;

                // If liquidation amount is specified, use that amount
                if (liquidationAmount !== 0) {
                    const onChainAmount = Math.floor(liquidationAmount * Math.pow(10, payDecimals));
                    if (onChainAmount > Number(totalBalance)) {
                        throw new Error("Insufficient balance for this Coin");
                    }
                    totalBalance = onChainAmount.toString();
                }

                // Prepare the pay coin
                if (payCoinInfo.symbol === "Sui") {
                    // Keep some SUI for gas
                    totalBalance = (Number(totalBalance) - 1 * 1e9).toString();

                    let [mergedCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(Number(totalBalance))]);

                    const [mergedCoinBalance] = txb.moveCall({
                        target: `0x2::coin::into_balance`,
                        arguments: [mergedCoin],
                        typeArguments: [payCoinInfo.address],
                    });

                    const [collateralBalance, remainingDebtBalance] = await liquidateFunction(
                        // @ts-ignore
                        txb,
                        payCoinInfo,
                        mergedCoinBalance,
                        collateralCoinInfo,
                        liquidationAddress,
                        totalBalance
                    );

                    const [collateralCoin] = txb.moveCall({
                        target: `0x2::coin::from_balance`,
                        arguments: [collateralBalance],
                        typeArguments: [collateralCoinInfo.address],
                    });

                    const [leftDebtCoin] = txb.moveCall({
                        target: `0x2::coin::from_balance`,
                        arguments: [remainingDebtBalance],
                        typeArguments: [payCoinInfo.address],
                    });

                    txb.transferObjects([collateralCoin, leftDebtCoin], sender);
                } else {
                    // For non-SUI coins, merge all coins first if needed
                    if (coins.data.length >= 2) {
                        let baseObj = coins.data[0].coinObjectId;
                        let allList = coins.data.slice(1).map(coin => coin.coinObjectId);
                        txb.mergeCoins(baseObj, allList);
                    }

                    let mergedCoin = txb.object(coins.data[0].coinObjectId);
                    const [collateralCoinBalance] = txb.moveCall({
                        target: `0x2::coin::into_balance`,
                        arguments: [mergedCoin],
                        typeArguments: [payCoinInfo.address],
                    });

                    const [collateralBalance, remainingDebtBalance] = await liquidateFunction(
                        // @ts-ignore
                        txb,
                        payCoinInfo,
                        collateralCoinBalance,
                        collateralCoinInfo,
                        liquidationAddress,
                        totalBalance
                    );

                    const [collateralCoin] = txb.moveCall({
                        target: `0x2::coin::from_balance`,
                        arguments: [collateralBalance],
                        typeArguments: [collateralCoinInfo.address],
                    });

                    const [leftDebtCoin] = txb.moveCall({
                        target: `0x2::coin::from_balance`,
                        arguments: [remainingDebtBalance],
                        typeArguments: [payCoinInfo.address],
                    });

                    txb.transferObjects([collateralCoin, leftDebtCoin], sender);
                }

                return {
                    content: [{
                        type: 'resource',
                        resource: await transactionToResource(txb, client),
                    }],
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to create Navi liquidation transaction: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
