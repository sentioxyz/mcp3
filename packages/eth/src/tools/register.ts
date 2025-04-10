import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFetchTool } from '@mcp3/common';
import { registerAbiTool } from "./abi-tool.js";
import { registerDownloadCodeTool } from "./download-code-tool.js";
import { registerInvokeTool } from "./invoke-tool.js";
import { listConfigs } from "../config.js";
import path from "path";
import fs from "fs";

/**
 * Register all Ethereum MCP tools with the server
 * @param server The MCP server instance
 * @param basePath The base path for the CLI
 * @param scope The scope for the MCP server
 */
export function registerTools(server: McpServer, basePath: string, scope: string) {
    // Register individual tools
    registerAbiTool(server, basePath);
    registerDownloadCodeTool(server, basePath);
    registerInvokeTool(server, basePath);

    // Register contract resources
    const configs = listConfigs(path.join(basePath, scope))
    for (const [p, c] of Object.entries(configs)) {
        server.resource(`${c.name ?? c.address}`, "contract:///" + c.address+"/abi", (uri) => {
            const dir = path.dirname(p);
            const abiFile = path.join(dir, 'abi.json')
            const output: any = { ...c }

            if (fs.existsSync(abiFile)) {
                output.abi = JSON.parse(fs.readFileSync(abiFile, 'utf-8'))
            }

            return ({
                contents: [
                    {
                        uri: `contract:///${c.address}/abi`,
                        mimeType: "application/json",
                        text: JSON.stringify(output)
                    },
                ]
            })
        })
    }

    // Register fetch tool from common package
    registerFetchTool(server);
}
