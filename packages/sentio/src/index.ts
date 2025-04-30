// Export core functionality
import {Registration} from "@mcp3/common";
import {registerTools} from "./tools/index.js";

/**
 * Register Sentio tools with the Registration
 * @param registration The Registration instance
 */
export async function register(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option("--sentio-endpoint <endpoint>", "Sentio API endpoint", "https://api.sentio.xyz");
        command.option("--setnio-api-key <sentio-api-key>", "Sentio API Key", "");
        command.option("--project <projects...>", "Sentio project names", []);
        
    });
    await registerTools(registration);
}