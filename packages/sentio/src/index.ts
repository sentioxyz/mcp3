// Export core functionality
import {Registration} from "@mcp3/common";
export {registerTools} from "./tools/index.js";

/**
 * Register Sentio global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
    registration.addGlobalOption((command) => {
        command.option("--sentio-endpoint <endpoint>", "Sentio API endpoint", "https://app.sentio.xyz");
        command.option("--sentio-api-key <api-key>", "Sentio API Key", "");
        command.option("--sentio-projects <projects>", "Sentio project names, comma-separated, in format of owner/slug", "");
    });
}

