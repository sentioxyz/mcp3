// Export core functionality
import { Registration } from "@mcp3/common";
import { registerTools } from "./tools/index.js";

export * from "./client.js";

/**
 * Register all DexScreener tools with the Registration
 * @param registration The Registration instance
 */
export function register(registration: Registration) {
  registerTools(registration);
}
