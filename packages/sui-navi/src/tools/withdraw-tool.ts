import {z} from 'zod';
import {Registration} from "@mcp3/common";
import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {transactionToResource} from '@mcp3/sui-base';
import {pool, Pool, PoolConfig, withdrawCoin} from 'navi-sdk'
import {getCoinInfo} from "../coin_info.js";
import {updateOraclePTB} from "navi-sdk";


/**
 * Register the Navi withdraw tool with the Registration
 * @param registration The Registration instance
 */
export function registerNaviWithdrawTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-withdraw',
        description: 'Create a Navi withdraw transaction, return the transaction bytes',
        args: {
            coinType: z.string().describe('The coin type to withdraw (e.g., "0x2::sui::SUI")'),
            amount: z.number().describe('The amount to withdraw'),
            walletAddress: z.string().describe('The wallet address to use')
        },
        callback: async ({coinType, amount, walletAddress}, extra) => {
            try {
                const sender = walletAddress;

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

                // @ts-ignore
                await updateOraclePTB(client, txb);

                const coinSymbol = coinInfo.symbol
                const poolConfig: PoolConfig = pool[coinSymbol as keyof Pool];

                // Call the withdrawCoin function from the SDK
                // @ts-ignore
                const [withdrawnCoin] = await withdrawCoin(txb, poolConfig, onChainAmount);

                // Transfer the withdrawn coin to the sender
                txb.transferObjects([withdrawnCoin], txb.pure.address(sender));

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
                        text: `Failed to create Navi withdraw transaction: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
