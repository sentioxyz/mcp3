import {Registration} from "@mcp3/common";
import { getWalletManager } from './wallet-manager.js';

/**
 * Get the default wallet address from the wallet manager if available
 * @param registration The Registration instance
 * @returns The wallet manager instance or null if not available
 */
export async function getDefaultWalletAddress(registration: Registration) {
    return await getWalletManager({
        nodeUrl: registration.globalOptions.nodeUrl,
        walletConfig: registration.globalOptions.walletConfig
    });
}
