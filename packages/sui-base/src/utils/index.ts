import {SuiClient} from '@mysten/sui/client';

/**
 * Create a SuiClient instance with the given node URL
 * @param nodeUrl The Sui RPC URL
 * @returns A SuiClient instance
 */
export function createSuiClient(nodeUrl: string) {
    return new SuiClient({ url: nodeUrl });
}

/**
 * Format a Sui balance for display
 * @param balance The balance in MIST
 * @returns The formatted balance in SUI
 */
export function formatSuiBalance(balance: string | number | bigint): string {
    const balanceNum = typeof balance === 'string' ? Number(balance) : Number(balance);
    return (balanceNum / 1_000_000_000).toFixed(9) + ' SUI';
}
