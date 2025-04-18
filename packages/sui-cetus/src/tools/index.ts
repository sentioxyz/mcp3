export * from './pool-info-tool.js';
export * from './positions-tool.js';
export * from './swap-tool.js';
export * from './liquidity-tool.js';
export * from './fees-tool.js';
export * from './rewards-tool.js';
export * from './apr-tool.js';
export * from './open-position-tool.js';
export * from './add-liquity-tool.js';
export * from './remove-liquidity-tool.js';
export * from './close-position-tool.js';
export * from './collect-fees-tool.js';
export * from './collect-rewards-tool.js';

import {Registration} from '@mcp3/common';
import {registerPoolInfoTool} from './pool-info-tool.js';
import {registerPositionsTool} from './positions-tool.js';
import {registerSwapTool} from './swap-tool.js';
import {registerLiquidityTool} from './liquidity-tool.js';
import {registerFeesTool} from './fees-tool.js';
import {registerRewardsTool} from './rewards-tool.js';
import {registerAprTool} from './apr-tool.js';
import {registerOpenPositionTools} from './open-position-tool.js';
import {registerAddLiquidityTools} from './add-liquity-tool.js';
import {registerRemoveLiquidityTool} from './remove-liquidity-tool.js';
import {registerClosePositionTool} from './close-position-tool.js';
import {registerCollectFeesTool} from './collect-fees-tool.js';
import {registerCollectRewardsTool} from './collect-rewards-tool.js';

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
  registerOpenPositionTools(registration);
  registerAddLiquidityTools(registration);
  registerRemoveLiquidityTool(registration);
  registerClosePositionTool(registration);
  registerCollectFeesTool(registration);
  registerCollectRewardsTool(registration);
}
