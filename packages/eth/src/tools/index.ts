import {Registration} from "@mcp3/common";
import {registerAbiTool} from "./abi-tool.js";
import {registerDownloadCodeTool} from "./download-code-tool.js";
import {registerInvokeTool} from "./invoke-tool.js";
 import {listConfigs} from "../config.js";
import path from "path";
import fs from "fs";

export async function registerEthTools(registration: Registration) {
    // Register tools
    registerAbiTool(registration);
    registerDownloadCodeTool(registration);
    registerInvokeTool(registration);


    // Register contract resources
    registration.addServeOption((command) => {
        command.action(async (options) => {
            const basePath = registration.globalOptions.basePath;
            const scope = registration.globalOptions.scope;

            // Register contract resources
            const configs = listConfigs(path.join(basePath, scope))
            for (const [p, c] of Object.entries(configs)) {
                registration.addResource({
                    name: `${c.name ?? c.address}`,
                    uri: "contract:///" + c.address+"/abi",
                    callback: (uri) => {
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
                    }
                });
            }
        });
    });
}
