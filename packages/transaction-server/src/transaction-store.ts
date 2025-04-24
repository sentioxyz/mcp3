import fs from 'fs';
import path from 'path';
import os from 'os';

// Store active transactions
interface PendingTransaction {
  transaction: any; // Transaction data
  createdAt: number;
  txBytes: string;
}

/**
 * Transaction store for managing pending transactions
 * This is a singleton that will be used across API routes
 * Transactions are stored as JSON files in a temporary directory
 */
class TransactionStore {
  private txDir: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private expirationTimeMs: number = 30 * 60 * 1000) {
    // Create a temporary directory for storing transactions
    this.txDir = path.join(os.tmpdir(), 'txs');
    fs.mkdirSync(this.txDir, { recursive: true });
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Add a transaction to the store
   * @param txId The transaction ID
   * @param transaction The transaction object
   * @param txBytes The transaction bytes (base64 encoded)
   */
  addTransaction(txId: string, transaction: any, txBytes: string): void {
    try {
      const txData: PendingTransaction = {
        transaction,
        txBytes,
        createdAt: Date.now()
      };

      // Write transaction data to a JSON file
      const filePath = this.getFilePath(txId);
      fs.writeFileSync(filePath, JSON.stringify(txData, null, 2), 'utf8');
    } catch (error) {
      console.error(`Error saving transaction ${txId} to file:`, error);
    }
  }

  /**
   * Get a transaction from the store
   * @param txId The transaction ID
   * @returns The pending transaction or undefined if not found
   */
  getTransaction(txId: string): PendingTransaction | undefined {
    try {
      const filePath = this.getFilePath(txId);

      if (!fs.existsSync(filePath)) {
        return undefined;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent) as PendingTransaction;
    } catch (error) {
      console.error(`Error reading transaction ${txId} from file:`, error);
      return undefined;
    }
  }

  /**
   * Remove a transaction from the store
   * @param txId The transaction ID
   */
  removeTransaction(txId: string): void {
    try {
      const filePath = this.getFilePath(txId);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Error removing transaction ${txId} file:`, error);
    }
  }

  /**
   * Clean up expired transactions
   */
  cleanupExpiredTransactions(): void {
    try {
      const now = Date.now();
      const files = fs.readdirSync(this.txDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.txDir, file);
        const stats = fs.statSync(filePath);

        // Check if the file is older than the expiration time
        if (now - stats.mtimeMs > this.expirationTimeMs) {
          fs.unlinkSync(filePath);
         }
      }
    } catch (error) {
      console.error('Error cleaning up expired transactions:', error);
    }
  }

  /**
   * Get the file path for a transaction ID
   * @param txId The transaction ID
   * @returns The file path
   */
  private getFilePath(txId: string): string {
    return path.join(this.txDir, `${txId}.json`);
  }

  /**
   * Start the cleanup interval
   */
  private startCleanupInterval(): void {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredTransactions();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop the cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Create a singleton instance
export const transactionStore = new TransactionStore();

// Export the type for use in other files
export type { PendingTransaction };
