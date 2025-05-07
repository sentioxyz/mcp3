// Export core functionality
import {Registration} from "@mcp3/common";

import { registerSUIBaseTools } from './tools/index.js';

export * from './utils/index.js';
export * from './cli/index.js';
export * from './coins.js';
export * from './transaction.js';

/**
 * Register global options for Sui Base
 * @param registration The Registration instance
 */
export function registerGlobalOptions(registration: Registration) {
    // No additional global options for sui-base beyond what's in cli/index.ts
}

/**
 * Register tools for Sui Base
 * @param registration The Registration instance
 */
export function registerTools(registration: Registration) {
    registerSUIBaseTools(registration);
}

/**
 * Register both global options and tools for Sui Base
 * @param registration The Registration instance
 */
export function register(registration: Registration) {
    registerGlobalOptions(registration);
    registerTools(registration);
}
