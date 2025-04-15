import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { getProviderEndpoint, invokeEthCall } from "../contract.js";
import { downloadABI } from "../abi.js";
import { findConfigByAddress } from "../config.js";
import { Registration } from "@mcp3/common";
import path from "path";
import fs from "fs";

/**
 * Register the eth-invoke-view-function tool with the Registration
 * @param registration The Registration instance
 */
export function registerInvokeTool(registration: Registration) {
    registration.addTool({
        name: "eth-invoke-view-function",
        description: "Invoke a view function on a contract",
        args: {
            address: z.string().describe("contract address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id"),
            functionName: z.string().describe("function name"),
            args: z.array(z.string()).optional().default([]).describe("method arguments"),
            block: z.number().optional().default(0).describe("specify block height, default is latest block"),
        },
        callback: async ({address, chain, functionName, args, block}, extra) => {
            try {
                const basePath = registration.globalOptions.basePath;
                const contractsDir = path.join(basePath, "contracts");
                const config = findConfigByAddress(address, contractsDir);
                let abi: any;
                if (!config) {
                    const downloaded = await downloadABI(chain as ChainId, address, contractsDir);
                    abi = downloaded.abi;
                } else {
                    const abiFile = path.join(path.dirname(config.configFile), 'abi.json');
                    const data = fs.readFileSync(abiFile, 'utf-8');
                    abi = JSON.parse(data);
                }
                const call = `${functionName}(${args.join(", ")})`;
                const result = await invokeEthCall(getProviderEndpoint(chain as ChainId), address, abi, call, block);
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(result, (key, value) =>
                            // @ts-ignore JSON.rawJSON only available on new version of node
                            typeof value === "bigint" ? JSON.rawJSON(value.toString()) : value)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: "text",
                        text: `Failed to invoke function: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
