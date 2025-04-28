/**
 * Utility functions for the transaction server
 */

// Store the transaction server URL
let serverUrl: string | null = null;

/**
 * Set the transaction server URL
 * @param url The URL of the transaction server
 */
export function setServerUrl(url: string | null): void {
  serverUrl = url;
}

/**
 * Get the transaction server URL
 * @returns The URL of the transaction server or the default URL
 */
export function getServerUrl(): string {
  return serverUrl || 'http://localhost:3999';
}



