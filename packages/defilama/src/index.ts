// Export core functionality
import {Registration} from "@mcp3/common";
import {registerTools} from "./tools/index.js";

export {registerTools} from "./tools/index.js";

/**
 * Register DeFiLlama global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option("--defilama-endpoint <endpoint>", "DeFiLlama API endpoint", "https://api.llama.fi");
    });
}

