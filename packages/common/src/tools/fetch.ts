import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fetch as httpFetch, HttpMethod, FetchResponse } from '../http.js';

/**
 * Register the fetch tool with an MCP server
 *
 * @param server - The MCP server to register the tool with
 */
export function registerFetchTool(server: McpServer): void {
  server.tool(
    'fetch',
    'Make HTTP requests and return responses (automatically handles JSON, text, and binary data based on content-type)',
    {
      url: z.string().url().describe('The URL to fetch from'),
      method: z.enum(['GET', 'POST', 'PUT']).default('GET').describe('The HTTP method to use'),
      headers: z.record(z.string()).optional().describe('Optional headers to include in the request'),
      body: z.any().optional().describe('Optional body to include in the request (for POST and PUT)'),
      timeout: z.number().positive().optional().default(30000).describe('Optional timeout in milliseconds')
    },
    async (params) => {
      try {
        const response = await httpFetch({
          url: params.url,
          method: params.method as HttpMethod,
          headers: params.headers,
          body: params.body,
          timeout: params.timeout
        });

        // Format the response based on the content type
        const isJson = response.contentType.includes('application/json');
        const isBinary = response.contentType.includes('application/octet-stream') ||
                       response.contentType.includes('image/') ||
                       response.contentType.includes('audio/') ||
                       response.contentType.includes('video/') ||
                       response.contentType.includes('application/pdf') ||
                       response.contentType.includes('application/zip');

        if (isJson) {
          // Return JSON as formatted text
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(response.data, null, 2)
            }],
            metadata: {
              contentType: response.contentType
            }
          };
        } else if (isBinary) {
          // Return binary data as a resource
          // Generate a unique resource URI based on URL and timestamp
          const resourceUri = `fetch://${encodeURIComponent(params.url)}?t=${Date.now()}`;

          // Convert ArrayBuffer to base64 string
          const base64Data = Buffer.from(response.data).toString('base64');

          return {
            content: [{
              type: 'resource',
              resource: {
                uri: resourceUri,
                mimeType: response.contentType,
                // Use blob format for binary data as required by MCP
                blob: base64Data
              }
            }],
            metadata: {
              contentType: response.contentType
            }
          };
        } else {
          // Return text as is
          return {
            content: [{
              type: 'text',
              text: response.data as string
            }],
            metadata: {
              contentType: response.contentType
            }
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: errorMessage }, null, 2)
          }],
          metadata: {
            error: true
          }
        };
      }
    }
  );
}
