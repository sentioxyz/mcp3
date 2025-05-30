import { Registration } from '@mcp3/common';
import { registerWalletManagementTools } from './wallet-management-tools.js';
import { registerTransactionTools } from './transaction-tools.js';


/**
 * Register all wallet tools with the Registration
 * @param registration The Registration instance
 */
export function registerWalletsTools(registration: Registration) {
  registerWalletManagementTools(registration);
  registerTransactionTools(registration);
}
