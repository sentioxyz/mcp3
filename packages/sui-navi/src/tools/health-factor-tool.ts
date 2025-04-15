import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {getHealthFactorCall} from "navi-sdk";
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the health-factor tool with the Registration
 * @param registration The Registration instance
 */
export function registerHealthFactorTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-health-factor',
        description: 'Get the health factor for a Sui address in Navi Protocol',
        args: {
            address: z.string().describe('The Sui address to check')
        },
        callback: async ({address}, extra) => {
            try {
                const suiClient = new SuiClient({url: registration.globalOptions.nodeUrl});
                // @ts-ignore
                const result = await getHealthFactorCall(address, suiClient);
                const healthFactor = Number(result[0]) / Math.pow(10, 27);

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(healthFactor)
                    }]
                };
            } catch (error) {
                console.error('Error fetching health factor:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to fetch health factor: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
