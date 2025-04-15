import {Registration} from "@mcp3/common";
import {registerAbiTool} from "./abi-tool.js";
import {registerViewFunctionTool} from "./view-function-tool.js";
import {registerEventsTool} from "./events-tool.js";
import {registerBalanceTool} from "./balance-tool.js";


export function registerSUITools(registration: Registration) {
    registerAbiTool(registration);
    registerViewFunctionTool(registration);
    registerEventsTool(registration);
    registerBalanceTool(registration);

}