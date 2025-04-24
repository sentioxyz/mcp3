// Server configuration
export interface ServerConfig {
  enabled: boolean;
  address: string;
  port: number;
}

// Default server configuration
export const DEFAULT_CONFIG: ServerConfig = {
  enabled: true,
  address: 'localhost',
  port: 3000
};

/**
 * Get the server URL based on configuration
 * @param config Server configuration
 * @returns The server URL
 */
export function getServerUrl(config: ServerConfig = DEFAULT_CONFIG): string {
  const host = config.address === '0.0.0.0' ? 'localhost' : config.address;
  return `http://${host}:${config.port}`;
}
