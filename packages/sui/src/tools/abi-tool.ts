import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { downloadABI } from '../abi.js';

/**
 * Register the sui-download-abi tool with the MCP server
 * @param server The MCP server instance
 * @param nodeUrl The Sui RPC URL
 */
export function registerAbiTool(server: McpServer, nodeUrl: string) {
    server.tool(
        'sui-download-abi',
        {
            objectId: z.string().describe('The object ID to get the ABI for')
        },
        async ({objectId}) => {
            try {
                const abi = await downloadABI(nodeUrl, objectId);
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(abi, null, 2)
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
    );
}
