import {Registration} from "@mcp3/common";
import {registerAbiTool} from "./abi-tool.js";
import {registerViewFunctionTool} from "./view-function-tool.js";
import {registerEventsTool} from "./events-tool.js";
import {registerBalanceTool} from "./balance-tool.js";

/**
 * Register all Sui base tools with the Registration
 * @param registration The Registration instance
 */
export function registerSUIBaseTools(registration: Registration) {
    registerAbiTool(registration);
    registerViewFunctionTool(registration);
    registerEventsTool(registration);
    registerBalanceTool(registration);
}

export { registerAbiTool } from "./abi-tool.js";
export { registerViewFunctionTool } from "./view-function-tool.js";
export { registerEventsTool } from "./events-tool.js";
export { registerBalanceTool } from "./balance-tool.js";
