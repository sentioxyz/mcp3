import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPluginIfAvailable } from '../packages/sui/src/utils/plugin-loader.js';

/**
 * Example of how to use the plugin loader in a new project
 */
async function main() {
  // Create an MCP server
  const server = new McpServer({
    name: 'Example MCP Server',
    version: '1.0.0',
    description: 'Example of conditional plugin loading'
  });

  // Options to pass to the plugin
  const options = {
    nodeUrl: 'https://fullnode.mainnet.sui.io:443',
    naviPackageId: '0x123...',
    naviStorageId: '0x456...',
    naviUiGetterId: '0x789...'
  };

  // Try to register the Navi plugin if it's available
  const naviRegistered = await registerPluginIfAvailable('@mcp3/sui-navi', server, options);
  
  if (naviRegistered) {
    console.log('Navi plugin was successfully registered');
  } else {
    console.log('Navi plugin is not available, continuing without it');
  }

  // You can try to register multiple plugins
  const plugins = [
    '@mcp3/sui-navi',
    'some-other-plugin',
    'another-plugin'
  ];

  // Register all available plugins
  const registeredPlugins = [];
  for (const plugin of plugins) {
    const registered = await registerPluginIfAvailable(plugin, server, options);
    if (registered) {
      registeredPlugins.push(plugin);
    }
  }

  console.log('Registered plugins:', registeredPlugins);
}

// Run the example
main().catch(console.error);
