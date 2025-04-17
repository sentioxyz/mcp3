import {z} from 'zod';
import {Registration} from "@mcp3/common";
import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {toBase64} from '@mysten/sui/utils';
import {fetchCoins, getWalletManager} from '@mcp3/sui-base';
import {depositCoin, pool, Pool, PoolConfig, returnMergedCoins} from 'navi-sdk'
import {getCoinInfo} from "../coin_info.js";

/**
 * Register the Navi deposit tool with the Registration
 * @param registration The Registration instance
 */
export function registerNaviDepositTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-deposit',
        description: 'Create and submit a Navi deposit transaction',
        args: {
            coinType: z.string().describe('The coin type to deposit (e.g., "0x2::sui::SUI")'),
            amount: z.number().describe('The amount to deposit'),
            walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)')
        },
        callback: async ({coinType, amount, walletAddress}, extra) => {
            try {
                // Get a wallet manager
                const walletManager = await getWalletManager({
                    nodeUrl: registration.globalOptions.nodeUrl,
                    walletConfig: registration.globalOptions.walletConfig
                });
                let sender: string
                if (walletAddress) {
                    sender = walletManager?.getWallet(walletAddress)?.address ?? walletAddress
                } else {
                    sender = walletManager?.getDefaultWallet()?.address ?? ''
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

                const coinInfo = getCoinInfo(coinType);
                if (!coinInfo) {
                    throw new Error("Not supported coin "+ coinType);
                }

                // Get coin metadata to determine decimals
                const client = new SuiClient({ url: registration.globalOptions.nodeUrl });
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

                if (coinSymbol == "Sui") {
                    const [toDeposit] = txb.splitCoins(txb.gas, [onChainAmount]);
                    // @ts-ignore
                    await depositCoin(txb, poolConfig, toDeposit, onChainAmount);
                } else {
                    // @ts-ignore
                    const mergedCoinObject = returnMergedCoins(txb, coinInfo);
                    const mergedCoinObjectWithAmount = txb.splitCoins(mergedCoinObject, [
                        onChainAmount,
                    ]);
                    // @ts-ignore
                    await depositCoin(txb, poolConfig, mergedCoinObjectWithAmount, onChainAmount);
                }

                return {
                    content: [{
                        type: 'resource',
                        resource: {
                            uri: `sui://tx/${await txb.getDigest({client})}`,
                            blob: toBase64(await txb.build({client}))
                        },
                    }],
                }

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to create Navi deposit transaction: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
