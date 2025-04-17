import {z} from 'zod';
import {Registration} from "@mcp3/common";
import {Transaction} from '@mysten/sui/transactions';
import {SuiClient} from '@mysten/sui/client';
import {getWalletManager} from '@mcp3/sui-base';
import {borrowCoin, pool, Pool, PoolConfig, updateOraclePTB} from 'navi-sdk'
import {getCoinInfo} from "../coin_info.js";
import {transactionToResource} from "./deposit-tool.js";

/**
 * Register the borrow tool with the Registration
 * @param registration The Registration instance
 */
export function registerBorrowTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-borrow',
        description: 'Borrow assets from Navi Protocol',
        args: {
            coinType: z.string().describe('The coin type to borrow (e.g., "Sui", "USDC", "USDT")'),
            amount: z.number().describe('The amount to borrow (in human-readable format, e.g., 10 for 10 SUI)'),
            walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)'),
            updateOracle: z.boolean().optional().default(true).describe('Whether to update the oracle before borrowing (default: true)')
        },
        callback: async ({coinType, amount, walletAddress, updateOracle}, extra) => {
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

                // Update oracle if requested
                if (updateOracle) {
                    // @ts-ignore
                    await updateOraclePTB(client, txb);
                }

                const coinSymbol = coinInfo.symbol
                const poolConfig: PoolConfig = pool[coinSymbol as keyof Pool];

                // Call the borrowCoin function from the SDK
                // @ts-ignore
                const [borrowedCoin] = await borrowCoin(txb, poolConfig, onChainAmount);
                
                // Transfer the borrowed coin to the sender
                txb.transferObjects([borrowedCoin], txb.pure.address(sender));

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
                        text: `Failed to create Navi borrow transaction: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
