import {SuiClient, SuiEventFilter} from '@mysten/sui.js/client';

export interface EventQueryOptions {
  nodeUrl: string;
  filter: SuiEventFilter;
  cursor?: string;
  limit?: number;
  descending?: boolean;
}

/**
 * Query events from Sui RPC
 * @param options Options for querying events
 * @returns The events data
 */
export async function queryEvents(options: EventQueryOptions) {
  const { nodeUrl, filter, cursor, limit = 50, descending = false } = options;

  const client = new SuiClient({ url: nodeUrl });

  try {
    return await client.queryEvents({
      query: filter,
      cursor: cursor ? JSON.parse(cursor) : null,
      limit,
      order: descending ? 'descending' : 'ascending',
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to query events: ${error.message}`);
    }
    throw new Error('Failed to query events: Unknown error');
  }
}

/**
 * Parse a filter string into a SuiEventFilter
 * @param filterStr The filter string in one of two formats:
 *   1. "package::module::type" - e.g., "0x2::coin::CoinEvent"
 *   2. "tx address" - e.g., "0x123..."
 * @returns The parsed SuiEventFilter
 */
export function parseEventFilter(filterStr: string): SuiEventFilter {
  const parts = filterStr.split('::');
  if (parts.length == 1) {
    return { Transaction: filterStr };
  }

  if (parts.length === 2) { // package + module
    return { MoveEventModule: { package: parts[0], module: parts[1] } };
  }
  if (parts.length === 3) { // package + module + type
    return { MoveEventType: filterStr };
  }

  throw new Error('Invalid filter format');
}
