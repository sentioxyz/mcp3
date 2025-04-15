import {Registration} from '@mcp3/common';
import {z} from 'zod';
import {getAddressPortfolio, NAVISDKClient} from 'navi-sdk';
import {SuiClient} from "@mysten/sui/client";

/**
 * Register the portfolio tool with the Registration
 * @param registration The Registration instance
 */
export function registerPortfolioTool(registration: Registration) {
    registration.addTool({
        name: 'sui-navi-portfolio',
        description: 'Get the Navi Protocol portfolio for a Sui address',
        args: {
            address: z.string().describe('The Sui address to check')
        },
        callback: async ({address}, extra) => {
            try {
                const suiClient = new SuiClient({url: registration.globalOptions.nodeUrl});

                // @ts-ignore
                const portfolio = await  getAddressPortfolio(address, false, suiClient, true);

                const content = JSON.stringify(Object.fromEntries(portfolio));
                return {
                    content: [{
                        type: 'text',
                        text: content
                    }]
                };
            } catch (error) {
                console.error('Error fetching portfolio:', error);
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to fetch portfolio: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        },
    });
}
