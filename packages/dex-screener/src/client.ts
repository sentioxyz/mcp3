import fetch from 'node-fetch';

/**
 * DexScreener API client
 */
export class DexScreenerClient {
  private baseUrl: string;

  /**
   * Create a new DexScreener API client
   * @param options Client options
   */
  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl || 'https://api.dexscreener.com';
  }

  /**
   * Get the latest token profiles
   * @returns The latest token profiles
   */
  async getTokenProfiles() {
    return this.fetchJson('/token-profiles/latest/v1');
  }

  /**
   * Get the latest boosted tokens
   * @returns The latest boosted tokens
   */
  async getTokenBoosts() {
    return this.fetchJson('/token-boosts/latest/v1');
  }

  /**
   * Get the tokens with most active boosts
   * @returns The tokens with most active boosts
   */
  async getTopTokenBoosts() {
    return this.fetchJson('/token-boosts/top/v1');
  }

  /**
   * Check orders paid for of token
   * @param chainId The chain ID
   * @param tokenAddress The token address
   * @returns The orders paid for of token
   */
  async getOrders(chainId: string, tokenAddress: string) {
    return this.fetchJson(`/orders/v1/${chainId}/${tokenAddress}`);
  }

  /**
   * Get one or multiple pairs by chain and pair address
   * @param chainId The chain ID
   * @param pairId The pair ID
   * @returns The pairs
   */
  async getPairsByChainAndPairAddress(chainId: string, pairId: string) {
    return this.fetchJson(`/latest/dex/pairs/${chainId}/${pairId}`);
  }

  /**
   * Search for pairs matching query
   * @param query The search query
   * @returns The pairs matching the query
   */
  async searchPairs(query: string) {
    return this.fetchJson(`/latest/dex/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get the pools of a given token address
   * @param chainId The chain ID
   * @param tokenAddress The token address
   * @returns The pools of the token
   */
  async getPoolsByTokenAddress(chainId: string, tokenAddress: string) {
    return this.fetchJson(`/token-pairs/v1/${chainId}/${tokenAddress}`);
  }

  /**
   * Get one or multiple pairs by token address
   * @param chainId The chain ID
   * @param tokenAddresses One or multiple, comma-separated token addresses (up to 30 addresses)
   * @returns The pairs
   */
  async getPairsByTokenAddress(chainId: string, tokenAddresses: string) {
    return this.fetchJson(`/tokens/v1/${chainId}/${tokenAddresses}`);
  }

  /**
   * Fetch JSON from the API
   * @param path The API path
   * @returns The JSON response
   */
  private async fetchJson(path: string) {
    const response = await fetch(`${this.baseUrl}${path}`);
    
    if (!response.ok) {
      return {
        uri : `${this.baseUrl}${path}`,
        status: response.status,
        message: await response.text(),
        isError: true
      }
    }
    
    return {
      uri : `${this.baseUrl}${path}`,
      status: response.status,
      result: await response.json()
    };
  }
}
