import {Registration} from "@mcp3/common";
import {registerCetusTools} from "./tools/index.js";
import {registerCetusResource} from "./resources/cetus-resource.js";

/**
 * Register global options for Sui Cetus
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
  // No additional global options for sui-cetus
}

/**
 * Register tools and resources for Sui Cetus
 * @param registration The Registration instance
 */
export function registerTools(registration: Registration) {
  registerCetusTools(registration);
  registerCetusResource(registration);
}

/**
 * Register both global options and tools for Sui Cetus
 * @param registration The Registration instance
 */
export function register(registration: Registration) {
  registerGlobalOptions(registration);
  registerTools(registration);
}
