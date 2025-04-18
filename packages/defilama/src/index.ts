// Export core functionality
import {Registration} from "@mcp3/common";
import {registerTools} from "./tools/index.js";

/**
 * Register DeFiLlama tools with the Registration
 * @param registration The Registration instance
 */
export function register(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option("--defilama-endpoint <endpoint>", "DeFiLlama API endpoint", "https://api.llama.fi");
    });
    registerTools(registration);
}
