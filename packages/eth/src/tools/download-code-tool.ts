import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { downloadCodes } from "../download-code.js";
import path from "path";

/**
 * Register the eth-download-code tool with the MCP server
 * @param server The MCP server instance
 * @param basePath The base path for the CLI
 */
export function registerDownloadCodeTool(server: McpServer, basePath: string) {
    server.tool(
        "eth-download-code",
        {
            address: z.string().describe("address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id")
        },
        async ({address, chain}) => {
            const c = chain as ChainId ?? ChainId.ETHEREUM;
            const codes = await downloadCodes(path.join(basePath, "contracts"), c, address)
            const content = codes.map(c => {
                const filename = c.file
                const content = c.content
                return `// ${filename}\n\n${content}`
            }).join("\n\n")
            return {
                content: codes.map(c => ({
                    type: "resource",
                    resource: {
                        uri: 'file://' + c.file,
                        text: content
                    }
                }))
            }
        }
    );
}
