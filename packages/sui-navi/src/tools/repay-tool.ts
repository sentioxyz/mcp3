import {z} from 'zod';
import {Registration} from "@mcp3/common";
import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {resolveWalletAddressOrThrow, transactionToResource} from '@mcp3/sui-base';
import {pool, Pool, PoolConfig, repayDebt, returnMergedCoins} from 'navi-sdk'
import {getCoinInfo} from "../coin_info.js";

/**
 * Register the repay tool with the Registration
 * @param registration The Registration instance
 */
export function registerRepayTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-repay',
        description: 'Repay debt to Navi Protocol',
        args: {
            coinType: z.string().describe('The coin type to repay (e.g., "Sui", "USDC", "USDT")'),
            amount: z.number().describe('The amount to repay (in human-readable format, e.g., 10 for 10 SUI)'),
            walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)')
        },
        callback: async ({coinType, amount, walletAddress}, extra) => {
            try {
                const sender = await resolveWalletAddressOrThrow(walletAddress);

                const coinInfo = getCoinInfo(coinType);
                if (!coinInfo) {
                    throw new Error("Not supported coin " + coinType);
                }

                // Get coin metadata to determine decimals
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});
                const metadata = await client.getCoinMetadata({
                    coinType: coinInfo.address
                });

                // Default to 9 decimals (like SUI) if metadata is not available
                const decimals = metadata?.decimals ?? 9;

                // Calculate the on-chain amount by multiplying by 10^decimals
                const onChainAmount = Math.floor(amount * Math.pow(10, decimals));

                const txb = new Transaction()
                txb.setSender(sender)

                const coinSymbol = coinInfo.symbol
                const poolConfig: PoolConfig = pool[coinSymbol as keyof Pool];

                // Get the coins owned by the sender
                const coins = await client.getCoins({
                    owner: sender,
                    coinType: coinInfo.address
                });

                if (!coins.data.length) {
                    throw new Error("Insufficient balance for this Coin");
                }

                if (coinSymbol == "Sui") {
                    const [toRepay] = txb.splitCoins(txb.gas, [onChainAmount]);
                    // @ts-ignore
                    await repayDebt(txb, poolConfig, toRepay, onChainAmount);
                } else {
                    // @ts-ignore
                    const mergedCoinObject = returnMergedCoins(txb, {
                        data: coins.data
                    });
                    const mergedCoinObjectWithAmount = txb.splitCoins(mergedCoinObject, [
                        onChainAmount,
                    ]);
                    // @ts-ignore
                    await repayDebt(txb, poolConfig, mergedCoinObjectWithAmount, onChainAmount);
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
                        text: `Failed to create Navi repay transaction: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
