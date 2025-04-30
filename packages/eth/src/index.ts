import {Registration} from "@mcp3/common";
import {dirname} from 'path';
import {fileURLToPath} from 'url';

// Export core functionality
export { downloadABI } from './abi.js';
export { invokeEthCall, getFunctionsFromContract, getProviderEndpoint } from './contract.js';
export { downloadCodes } from './download-code.js';
export { findConfigByAddress, listConfigs, writeConfig, type YamlConfig } from './config.js';

/**
 * Register Ethereum global options with the Registration
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
  // Get the base path for the CLI
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const basePath = dirname(__dirname);

  registration.addGlobalOption((command) => {
    command.option('-p, --base-path <path>', 'Base path for the CLI', basePath);
    command.option('-s, --scope <scope>', 'Limit the scope MCP to a specific subproject', './contracts');
  });
}

// Export tool registration functions
export { registerEthTools } from './tools/index.js';
export { registerAbiTool } from './tools/abi-tool.js';
export { registerDownloadCodeTool } from './tools/download-code-tool.js';
export { registerInvokeTool } from './tools/invoke-tool.js';

// Export CLI functionality
export { main } from './cli/index.js';
