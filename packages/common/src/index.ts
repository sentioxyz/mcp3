// Export HTTP utilities
export { fetch, HttpError, type FetchOptions, type HttpMethod, type FetchResponse } from './http.js';

// Export MCP tools
export { registerFetchTool } from './tools/fetch.js';

// Add validation utilities
export function validateAddressFormat(address: string): void {
  if (!address) {
    throw new Error('Address cannot be empty');
  }

  if (!address.startsWith('0x')) {
    throw new Error('Address must start with 0x');
  }

  // Basic hex validation (can be extended for specific blockchain requirements)
  const hexRegex = /^0x[0-9a-fA-F]+$/;
  if (!hexRegex.test(address)) {
    throw new Error('Address must be a valid hexadecimal string');
  }
}

// Error utility function
export function errorAndExit(message: string): never {
  console.error(message);
  process.exit(1);
}