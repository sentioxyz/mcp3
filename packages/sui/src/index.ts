

// Export core functionality
import {Registration} from "@mcp3/common";

export { downloadABI } from './abi.js';
export { callViewFunction, type ViewFunctionOptions } from './call.js';
export { queryEvents, parseEventFilter,type EventQueryOptions } from './events.js';

// Export tool registration functions
export { registerSUITools } from './tools/index.js';
export { registerAbiTool } from './tools/abi-tool.js';
export { registerViewFunctionTool } from './tools/view-function-tool.js';
export { registerEventsTool } from './tools/events-tool.js';
export { registerBalanceTool } from './tools/balance-tool.js';


const availableSubProjects = [
    '@mcp3/sui-navi',
    '@mcp3/sui-cetus'
]

export async function registerSubProjects(registration: Registration) {
    for (const subProject of availableSubProjects) {
        try {
            const subProjectModule = await import(subProject);
            subProjectModule.register(registration);
            console.error(`Loaded subproject ${subProject}`);
        } catch (e) {
            // Ignore errors
            console.error(`Subproject ${subProject} not found, skipped`);
        }
    }
}