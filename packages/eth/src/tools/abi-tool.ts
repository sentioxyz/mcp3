import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { downloadABI } from "../abi.js";
import path from "path";

/**
 * Register the eth-download-abi tool with the MCP server
 * @param server The MCP server instance
 * @param basePath The base path for the CLI
 */
export function registerAbiTool(server: McpServer, basePath: string) {
    server.tool(
        "eth-download-abi",
        {
            address: z.string().describe("address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id"),
            name: z.string().optional().describe("contract name")
        },
        async ({address, chain, name}) => {
            const c = chain as ChainId ?? ChainId.ETHEREUM;
            const {file, abi} = await downloadABI(c, address, path.join(basePath, "contracts"), name)
            const output = {
                address,
                chain: c,
                abi
            }
            return {
                content: [{
                    type: "resource",
                    resource:  {
                        uri: `contract:///${address}/abi`,
                        mimeType: "application/json",
                        text: JSON.stringify(output)
                    },
                }]
            }
        }
    );
}
