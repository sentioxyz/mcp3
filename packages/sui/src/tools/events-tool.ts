import { z } from 'zod';
import { parseEventFilter, queryEvents } from '../events.js';
import { Registration } from "@mcp3/common";

export function registerEventsTool(registration: Registration) {
    registration.addTool({
        name: 'sui-query-events',
        description: 'Query events from the Sui blockchain',
        args: {
            filterStr: z.string().describe('Filter string in one of formats: "txId", "package::module::type"'),
            cursor: z.string().optional().describe('Pagination cursor (JSON string)'),
            limit: z.number().optional().describe('Maximum number of events to return'),
            descending: z.boolean().optional().describe('Sort events in descending order')
        },
        callback: async ({filterStr, cursor, limit, descending}, extra) => {
            try {
                const filter = parseEventFilter(filterStr);
                const events = await queryEvents({
                    nodeUrl: registration.serverOptions.nodeUrl,
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
    });
}
