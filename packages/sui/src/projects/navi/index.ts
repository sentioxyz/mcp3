import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function register(server: McpServer, options: any) {

    server.resource("navi", "sui:///projects/navi", (uri) => {
        return {
            contents: [
                {
                    uri: uri.toString(),
                    mimeType: "text/plain",
                    text: `
# Working with Navi Contracts

1. Finding the Package ID
- For Navi protocol: Check https://open-api.naviprotocol.io/api/package for the latest package ID
- Find storage-id, uiGetter-package-id and other info from: https://raw.githubusercontent.com/naviprotocol/navi-sdk/refs/heads/main/src/address.ts
- Check contract uiGetter contract because navi portfolio use it to retrieve data   

## 2. Getting the Contract ABI
- Use sui-download-abi download the ABI for the package ID
- This returns all modules, structs, and functions in the package
- Focus on public functions (marked with \`public\` or \`public(friend)\`)
- Look for view functions (read-only functions that don't modify state)
- Analyze function parameters and return types to understand the contract interface

## 4. Finding Parameter Values from Events
- If not provided, find parameter values from events using tool sui-query-events
- Filter events by package, module, or type
- Extract relevant data from event JSON
- Use event data to populate function parameters

## 5. Calling View Functions and Interpreting Results
- Call the function using the tool sui-view-function
- Interpreting results:
  * Numbers are often returned as strings due to BigInt limitations
  * Object IDs are returned as hex strings
  * Structs are returned as nested JSON objects
  * Convert timestamps to human-readable dates
  * Format large numbers with appropriate decimal places

## 6. Call Sui RPC Node api if need more data on chain
- get the rpc api spec from https://github.com/MystenLabs/sui/blob/main/crates/sui-open-rpc/spec/openrpc.json
- the rpc endpoint is ${options.nodeUrl}
`},
            ]
        };
    });
}