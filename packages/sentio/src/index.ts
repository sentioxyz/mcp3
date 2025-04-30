// Export core functionality
import {Registration} from "@mcp3/common";
import {registerTools} from "./tools/index.js";

/**
 * Register Sentio global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option("--sentio-endpoint <endpoint>", "Sentio API endpoint", "https://api.sentio.xyz");
        command.option("--sentio-api-key <api-key>", "Sentio API Key", "");
        command.option("--sentio-projects <projects...>", "Sentio project names", []);
    });
}

/**
 * Register Sentio tools with the Registration
 * @param registration The Registration instance
 */
export async function register(registration: Registration) {
    registerGlobalOptions(registration);

    // Register all Sentio tools
    await registerTools(registration);
}