import { Registration } from "@mcp3/common";
import { z } from "zod";
import { DexScreenerClient } from "../client.js";

/**
 * Format the API response for display
 * @param response The API response from the client
 * @returns The formatted response
 */
function toResult(response: any): any {
  if (response.isError) {
    return {
      content: [{
        type: 'text',
        text: `Failed to fetch from ${response.uri}: ${response.message} (Status: ${response.status})`
      }],
      isError: true
    };
  }

  return {
    content: [{
      type: "resource",
      resource: [{
        uri: response.uri,
        mimeType: "application/json",
        text: JSON.stringify(response.result, null, 2)
      }],
    }]
  };
}

/**
 * Register all DexScreener tools with the Registration
 * @param registration The Registration instance
 */
export async function registerTools(registration: Registration) {
  // Token profile endpoints
  registration.addTool({
    name: 'dexscreener-get-token-profiles',
    description: 'Get the latest token profiles',
    args: {},
    callback: async (_, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getTokenProfiles();
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-get-token-boosts',
    description: 'Get the latest boosted tokens',
    args: {},
    callback: async (_, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getTokenBoosts();
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-get-top-token-boosts',
    description: 'Get the tokens with most active boosts',
    args: {},
    callback: async (_, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getTopTokenBoosts();
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-get-orders',
    description: 'Check orders paid for of token',
    args: {
      chainId: z.string().describe('Chain ID (e.g., ethereum, solana)'),
      tokenAddress: z.string().describe('Token address')
    },
    callback: async ({ chainId, tokenAddress }, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getOrders(chainId, tokenAddress);
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  // Pair endpoints
  registration.addTool({
    name: 'dexscreener-get-pairs',
    description: 'Get one or multiple pairs by chain and pair address',
    args: {
      chainId: z.string().describe('Chain ID (e.g., ethereum, solana)'),
      pairId: z.string().describe('Pair address')
    },
    callback: async ({ chainId, pairId }, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getPairsByChainAndPairAddress(chainId, pairId);
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-search-pairs',
    description: 'Search for pairs matching query',
    args: {
      q: z.string().describe('Search query (e.g., ETH/USDT)')
    },
    callback: async ({ q }, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.searchPairs(q);
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-get-token-pairs',
    description: 'Get the pools of a given token address',
    args: {
      chainId: z.string().describe('Chain ID (e.g., ethereum, solana)'),
      tokenAddress: z.string().describe('Token address')
    },
    callback: async ({ chainId, tokenAddress }, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getPoolsByTokenAddress(chainId, tokenAddress);
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });

  registration.addTool({
    name: 'dexscreener-get-tokens',
    description: 'Get one or multiple pairs by token address',
    args: {
      chainId: z.string().describe('Chain ID (e.g., ethereum, solana)'),
      tokenAddresses: z.string().describe('One or multiple, comma-separated token addresses (up to 30 addresses)')
    },
    callback: async ({ chainId, tokenAddresses }, extra) => {
      const baseUrl = registration.globalOptions.dexscreenerEndpoint || 'https://api.dexscreener.com';
      const client = new DexScreenerClient({ baseUrl });

      try {
        const response = await client.getPairsByTokenAddress(chainId, tokenAddresses);
        return toResult(response);
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    }
  });
}
