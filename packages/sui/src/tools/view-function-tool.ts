import { z } from 'zod';
import { callViewFunction } from '../call.js';
import { Registration } from "@mcp3/common";

export function registerViewFunctionTool(registration: Registration) {
    registration.addTool({
        name: 'sui-call-view-function',
        description: 'Call a view function on the Sui blockchain',
        args: {
            address: z.string().describe('The module address (e.g., 0x2::coin::CoinStore)'),
            module: z.string().describe('The module name'),
            functionName: z.string().describe('The name of the function to call (e.g., "function" or "function<T0,T1>")'),
            params: z.array(z.any()).optional().describe('Parameters to pass to the function')
        },
        callback: async ({address, module, functionName, params}, extra) => {
            // Parse type arguments from function name if present
            let actualFunctionName = functionName;
            let typeArguments: string[] = [];

            const typeArgsMatch = functionName.match(/^(\w+)<([^>]*)>$/);
            if (typeArgsMatch) {
                actualFunctionName = typeArgsMatch[1];
                typeArguments = typeArgsMatch[2].split(',').map((arg: any) => arg.trim());
            }
            try {
                const nodeUrl = registration.globalOptions.nodeUrl;
                const result = await callViewFunction({
                    nodeUrl,
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
    });
}
