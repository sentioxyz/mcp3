export * from './pool-info-tool.js';
export * from './positions-tool.js';
export * from './swap-tool.js';
export * from './liquidity-tool.js';
export * from './fees-tool.js';
export * from './rewards-tool.js';
export * from './apr-tool.js';

import {Registration} from '@mcp3/common';
import {registerPoolInfoTool} from './pool-info-tool.js';
import {registerPositionsTool} from './positions-tool.js';
import {registerSwapTool} from './swap-tool.js';
import {registerLiquidityTool} from './liquidity-tool.js';
import {registerFeesTool} from './fees-tool.js';
import {registerRewardsTool} from './rewards-tool.js';
import {registerAprTool} from './apr-tool.js';

/**
 * Register all Cetus tools with the Registration
 * @param registration The Registration instance
 */
export function registerCetusTools(registration: Registration) {
  // Register individual tools
  registerPoolInfoTool(registration);
  registerPositionsTool(registration);
  registerSwapTool(registration);
  registerLiquidityTool(registration);
  registerFeesTool(registration);
  registerRewardsTool(registration);
  registerAprTool(registration);
}
