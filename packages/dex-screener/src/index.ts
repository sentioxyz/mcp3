// Export core functionality
import { Registration } from "@mcp3/common";

export { registerTools } from "./tools/index.js";

export * from "./client.js";

/**
 * Register DexScreener global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
  registration.addGlobalOption((command) => {
    command.option("--dexscreener-endpoint <endpoint>", "DexScreener API endpoint", "https://api.dexscreener.com");
  });
}

