/**
 * Client for interacting with the transaction server
 */
export class TransactionServerClient {
  /**
   * Create a new TransactionServerClient
   * @param serverUrl The URL of the transaction server
   */
  constructor(private serverUrl: string) {}

  /**
   * Register a transaction with the server
   * @param txBytes The transaction bytes (base64 encoded)
   * @returns The transaction ID and URL
   */
  async registerTransaction(txBytes: string): Promise<{ txId: string; url: string }> {
    const response = await fetch(`${this.serverUrl}/api/sui/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: txBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register transaction: ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get a transaction from the server
   * @param txId The transaction ID
   * @returns The transaction bytes
   */
  async getTransaction(txId: string): Promise<{ txId: string; txBytes: string }> {
    const response = await fetch(`${this.serverUrl}/api/sui/tx/${txId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get transaction: ${errorText}`);
    }

    return await response.json();
  }
}
