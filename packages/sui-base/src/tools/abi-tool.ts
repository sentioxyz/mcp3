import {z} from 'zod';
import {downloadABI} from '../abi.js';
import {Registration} from "@mcp3/common";

/**
 * Register the ABI tool with the Registration
 * @param registration The Registration instance
 */
export function registerAbiTool(registration: Registration) {
    registration.addTool({
        name: 'sui-download-abi',
        description: 'Get the ABI for a given object ID',
        args: {
            objectId: z.string().describe('The object ID to get the ABI for')
        },
        callback: async ({objectId}, extra) => {
            try {
                const nodeUrl = registration.globalOptions.nodeUrl;
                const abi = await downloadABI(nodeUrl, objectId);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({modules: abi}, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to download ABI: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    })
}
