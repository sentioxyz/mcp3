import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { getProviderEndpoint, invokeEthCall } from "../contract.js";
import { downloadABI } from "../abi.js";
import { findConfigByAddress } from "../config.js";
import path from "path";
import fs from "fs";

/**
 * Register the eth-invoke-view-function tool with the MCP server
 * @param server The MCP server instance
 * @param basePath The base path for the CLI
 */
export function registerInvokeTool(server: McpServer, basePath: string) {
    server.tool(
        "eth-invoke-view-function",
        {
            address: z.string().describe("contract address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id"),
            functionName: z.string().describe("function name"),
            args: z.array(z.string()).optional().default([]).describe("method arguments"),
            block: z.number().optional().default(0).describe("specify block height, default is latest block"),
        },
        async ({address, chain, functionName, args, block}) => {
            const contractsDir = path.join(basePath, "contracts");
            const config = findConfigByAddress(address, contractsDir)
            let abi: any
            if (!config) {
                const downloaded = await downloadABI(chain as ChainId, address, contractsDir)
                abi = downloaded.abi
            } else {
                const abiFile = path.join(path.dirname(config.configFile), 'abi.json')
                const data = fs.readFileSync(abiFile, 'utf-8')
                abi = JSON.parse(data)
            }
            const call = `${functionName}(${args.join(", ")})`
            const result = await invokeEthCall(getProviderEndpoint(chain as ChainId), address, abi, call, block)
            return {
                content: [{
                    type: "text",
                    text: JSON.stringify(result, (key, value) =>
                        // @ts-ignore JSON.rawJSON only available on new version of node
                        typeof value === "bigint" ? JSON.rawJSON(value.toString()) : value)
                }]
            }
        }
    );
}
