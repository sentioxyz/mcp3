import { main } from './cli/index.js';

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export MCP server functionality
export { startServer } from './server.js';

// Export core functionality
export { downloadABI } from './abi.js';
export { callViewFunction, ViewFunctionOptions } from './call.js';
export { queryEvents, parseEventFilter, EventQueryOptions } from './events.js';

// Export tool registration functions
export { registerTools } from './tools/register.js';
export { registerAbiTool } from './tools/abi-tool.js';
export { registerViewFunctionTool } from './tools/view-function-tool.js';
export { registerEventsTool } from './tools/events-tool.js';
