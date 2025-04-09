import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetchJSON, HttpMethod } from '../http.js';

/**
 * Register the fetch-json tool with an MCP server
 *
 * @param server - The MCP server to register the tool with
 */
export function registerFetchJSONTool(server: McpServer): void {
  server.tool(
    'fetch-json',
    'Make HTTP requests and return JSON responses',
    {
      url: z.string().url().describe('The URL to fetch from'),
      method: z.enum(['GET', 'POST', 'PUT']).default('GET').describe('The HTTP method to use'),
      headers: z.record(z.string()).optional().describe('Optional headers to include in the request'),
      body: z.any().optional().describe('Optional body to include in the request (for POST and PUT)'),
      timeout: z.number().positive().optional().default(30000).describe('Optional timeout in milliseconds')
    },
    async (params) => {
      try {
        const result = await fetchJSON({
          url: params.url,
          method: params.method as HttpMethod,
          headers: params.headers,
          body: params.body,
          timeout: params.timeout
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2)
          }]
        };
      }
    }
  );
}
