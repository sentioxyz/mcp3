import {Registration} from "@mcp3/common";
import {registerNaviTools} from "./tools/index.js";
import {registerNaviResource} from "./resources/navi-resource.js";

/**
 * Register global options for Sui Navi
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
  // No additional global options for sui-navi
}

/**
 * Register tools and resources for Sui Navi
 * @param registration The Registration instance
 */
export async function registerTools(registration: Registration) {
  registerNaviTools(registration);
  registerNaviResource(registration);
}


