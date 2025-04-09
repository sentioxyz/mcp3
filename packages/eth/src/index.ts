import { main } from './cli/index.js';

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export MCP server functionality
export { serve } from './serve.js';

// Export core functionality
export { downloadABI } from './abi.js';
export { invokeEthCall, getFunctionsFromContract, getProviderEndpoint } from './contract.js';
export { downloadCodes } from './download-code.js';
export { findConfigByAddress, listConfigs, writeConfig, YamlConfig } from './config.js';

// Export tool registration functions
export { registerTools } from './tools/register.js';
export { registerAbiTool } from './tools/abi-tool.js';
export { registerDownloadCodeTool } from './tools/download-code-tool.js';
export { registerInvokeTool } from './tools/invoke-tool.js';

// Export CLI functionality
export { main } from './cli/index.js';
