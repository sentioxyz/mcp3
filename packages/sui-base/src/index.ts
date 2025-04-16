// Export core functionality
import {Registration} from "@mcp3/common";

import { registerSUIBaseTools } from './tools/index.js';

export * from './utils/index.js';
export * from './cli/index.js';
export * from './address.js'

export function register(registration: Registration) {
    registerSUIBaseTools(registration);
}
