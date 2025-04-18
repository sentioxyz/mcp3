import {Registration} from "@mcp3/common";
import {z} from 'zod';
import {initCetusSDK} from '@cetusprotocol/cetus-sui-clmm-sdk';
import {SuiClient} from '@mysten/sui/client';
import {resolveWalletAddressOrThrow, transactionToResource} from '@mcp3/sui-base';

/**
 * Register the collect fees tool with the Registration
 * @param registration The Registration instance
 */
export function registerCollectFeesTool(registration: Registration) {
    registration.addTool({
        name: 'sui-cetus-collect-fees',
        description: 'Collect fees from a position in Cetus Protocol',
        args: {
            positionId: z.string().describe('The position ID to collect fees from'),
            walletAddress: z.string().optional().describe('The wallet address to use (optional, uses default if not provided)')
        },
        callback: async ({positionId, walletAddress}, extra) => {
            try {
                // Initialize the Cetus SDK
                const sdk = initCetusSDK({
                    network: 'mainnet',
                    fullNodeUrl: registration.globalOptions.nodeUrl
                });
                const sender: string = await resolveWalletAddressOrThrow(walletAddress);

                // Get position information
                const position = await sdk.Position.getPositionById(positionId);

                // Get pool information
                const pool = await sdk.Pool.getPool(position.pool);

                // Build collect fees params
                const collectFeesParams = {
                    pool_id: pool.poolAddress,
                    coinTypeA: pool.coinTypeA,
                    coinTypeB: pool.coinTypeB,
                    pos_id: positionId
                };

                // Create collect fees transaction payload
                const collectFeesTransactionPayload = await sdk.Position.collectFeeTransactionPayload(
                    collectFeesParams
                );

                // Create SUI client
                const client = new SuiClient({url: registration.globalOptions.nodeUrl});

                // Set sender
                collectFeesTransactionPayload.setSender(sender);

                return {
                    content: [{
                        type: 'resource',
                        // @ts-ignore
                        resource: await transactionToResource(collectFeesTransactionPayload, client),
                    }]
                };
            } catch (error) {
                console.error('Error collecting fees:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to collect fees: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
