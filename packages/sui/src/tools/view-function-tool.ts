import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { callViewFunction } from '../call.js';

/**
 * Register the sui-view-function tool with the MCP server
 * @param server The MCP server instance
 * @param nodeUrl The Sui RPC URL
 */
export function registerViewFunctionTool(server: McpServer, nodeUrl: string) {
    server.tool(
        'sui-view-function',
        {
            address: z.string().describe('The module address (e.g., 0x2::coin::CoinStore)'),
            module: z.string().describe('The module name'),
            functionName: z.string().describe('The name of the function to call (e.g., "function" or "function<T0,T1>")'),
            params: z.array(z.any()).optional().describe('Parameters to pass to the function')
        },
        async ({address, module, functionName, params}) => {
            // Parse type arguments from function name if present
            let actualFunctionName = functionName;
            let typeArguments: string[] = [];

            const typeArgsMatch = functionName.match(/^(\w+)<([^>]*)>$/);
            if (typeArgsMatch) {
                actualFunctionName = typeArgsMatch[1];
                typeArguments = typeArgsMatch[2].split(',').map(arg => arg.trim());
            }
            try {
                const result = await callViewFunction({
                    nodeUrl: nodeUrl,
                    packageId: address,
                    module,
                    functionName: actualFunctionName,
                    params: params || [],
                    typeArguments: typeArguments
                });

                // The result is already decoded by callFunction
                // Just need to handle any potential BigInt values
                const replacer = (key: string, value: any) => {
                    if (typeof value === 'bigint') {
                        return value.toString();
                    }
                    return value;
                };

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result, replacer, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to call view function: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    );
}
