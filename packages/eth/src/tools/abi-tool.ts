import { z } from "zod";
import { ChainId } from "@sentio/chain";
import { downloadABI } from "../abi.js";
import { Registration } from "@mcp3/common";
import path from "path";

/**
 * Register the eth-download-abi tool with the Registration
 * @param registration The Registration instance
 */
export function registerAbiTool(registration: Registration) {
    registration.addTool({
        name: "eth-download-abi",
        description: "Download ABI for a contract",
        args: {
            address: z.string().describe("address"),
            chain: z.string().optional().default(ChainId.ETHEREUM).describe("chain id"),
            name: z.string().optional().describe("contract name")
        },
        callback: async ({address, chain, name}, extra) => {
            try {
                const basePath = registration.globalOptions.basePath;
                const c = chain as ChainId ?? ChainId.ETHEREUM;
                const {file, abi} = await downloadABI(c, address, path.join(basePath, "contracts"), name);
                const output = {
                    address,
                    chain: c,
                    abi
                };
                return {
                    content: [{
                        type: "resource",
                        resource:  {
                            uri: `contract:///${address}/abi`,
                            mimeType: "application/json",
                            text: JSON.stringify(output)
                        },
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: "text",
                        text: `Failed to download ABI: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    });
}
