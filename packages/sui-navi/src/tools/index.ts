
export * from './pool-info-tool.js';
export * from './health-factor-tool.js';
export * from './rewards-tool.js';
export * from './portfolio-tool.js';
export * from './swap-quote-tool.js';
export * from './deposit-tool.js';

import {Registration} from '@mcp3/common';
import {registerPoolInfoTool} from './pool-info-tool.js';
import {registerHealthFactorTool} from './health-factor-tool.js';
import {registerRewardsTool} from './rewards-tool.js';
import {registerPortfolioTool} from './portfolio-tool.js';
import {registerSwapQuoteTool} from './swap-quote-tool.js';
import {registerNaviDepositTool} from "./deposit-tool.js";

/**
 * Register all Navi tools with the Registration
 * @param registration The Registration instance
 */
export function registerNaviTools(registration: Registration) {
  // Register individual tools
  registerPoolInfoTool(registration);
  registerHealthFactorTool(registration);
  registerRewardsTool(registration);
  registerPortfolioTool(registration);
  registerSwapQuoteTool(registration);
  registerNaviDepositTool(registration);
}

