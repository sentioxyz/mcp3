import {Registration} from "@mcp3/common";
import {registerWalletResource} from "./wallet-resource.js";

/**
 * Register all Sui resources with the Registration
 * @param registration The Registration instance
 */
export function registerSUIResources(registration: Registration) {
  registerWalletResource(registration);
}

export { registerWalletResource } from "./wallet-resource.js";
