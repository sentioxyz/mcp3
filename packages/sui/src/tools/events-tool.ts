import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { parseEventFilter, queryEvents } from '../events.js';

/**
 * Register the sui-query-events tool with the MCP server
 * @param server The MCP server instance
 * @param nodeUrl The Sui RPC URL
 */
export function registerEventsTool(server: McpServer, nodeUrl: string) {
    server.tool(
        'sui-query-events',
        {
            filterStr: z.string().describe('Filter string in one of formats: "txId", "package::module::type"'),
            cursor: z.string().optional().describe('Pagination cursor (JSON string)'),
            limit: z.number().optional().describe('Maximum number of events to return'),
            descending: z.boolean().optional().describe('Sort events in descending order')
        },
        async ({filterStr, cursor, limit, descending}) => {
            try {
                const filter = parseEventFilter(filterStr);
                const events = await queryEvents({
                    nodeUrl: nodeUrl,
                    filter,
                    cursor,
                    limit: limit || 50,
                    descending: descending || false
                });

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(events, null, 2)
                    }]
                };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{
                        type: 'text',
                        text: `Failed to query events: ${errorMessage}`
                    }],
                    isError: true
                };
            }
        }
    );
}
