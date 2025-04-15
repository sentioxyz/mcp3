import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { downloadCodes } from "../download-code.js";
import { Registration } from "@mcp3/common";
import path from "path";

/**
 * Register the eth-download-code tool with the Registration
 * @param registration The Registration instance
 */
export function registerDownloadCodeTool(registration: Registration) {
    registration.addTool({
        name: "eth-download-code",
        description: "Download source code for a contract",
        args: {
            address: z.string().describe("address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id")
        },
        callback: async ({address, chain}, extra) => {
            try {
                const basePath = registration.globalOptions.basePath;
                const c = chain as ChainId ?? ChainId.ETHEREUM;
                const codes = await downloadCodes(path.join(basePath, "contracts"), c, address);
                const content = codes.map(c => {
                    const filename = c.file;
                    const content = c.content;
                    return `// ${filename}\n\n${content}`;
                }).join("\n\n");
                return {
                    content: codes.map(c => ({
                        type: "resource",
                        resource: {
                            uri: 'file://' + c.file,
                            text: content
                        }
                    }))
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: "text",
                        text: `Failed to download code: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
