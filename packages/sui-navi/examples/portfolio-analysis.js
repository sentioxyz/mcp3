import { NaviClient } from '@mcp3/sui-navi';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function analyzePortfolio(address) {
  try {
    // Initialize the client
    const client = new NaviClient({
      networkType: 'mainnet'
    });

    console.log(`Analyzing portfolio for address: ${address}`);
    
    // Get portfolio information
    const portfolio = await client.getNaviPortfolio(address);
    
    // Get health factor
    const healthFactor = await client.getHealthFactor(address);
    
    // Get available rewards
    const rewards = await client.getAvailableRewards(address);
    
    // Calculate totals
    const totalSupplyValue = portfolio.reduce((acc, item) => acc + item.supplyValue, 0);
    const totalBorrowValue = portfolio.reduce((acc, item) => acc + item.borrowValue, 0);
    const netValue = totalSupplyValue - totalBorrowValue;
    
    // Calculate total rewards value
    const totalRewardsValue = rewards.reduce((acc, reward) => acc + reward.value, 0);
    
    // Create a report
    const report = {
      address,
      healthFactor: healthFactor.healthFactor,
      status: healthFactor.healthFactor >= 1 ? 'HEALTHY' : 'AT_RISK',
      portfolio: {
        assets: portfolio,
        totalSupplyValue,
        totalBorrowValue,
        netValue
      },
      rewards: {
        items: rewards,
        totalValue: totalRewardsValue
      },
      timestamp: new Date().toISOString()
    };
    
    // Print the report
    console.log('Portfolio Analysis Report:');
    console.log(JSON.stringify(report, null, 2));
    
    // Save the report to a file
    const filename = `portfolio-${address.substring(0, 8)}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`Report saved to ${filename}`);
    
    return report;
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    throw error;
  }
}

// Usage
if (process.argv.length < 3) {
  console.error('Please provide an address to analyze');
  process.exit(1);
}

const address = process.argv[2];
analyzePortfolio(address).catch(error => {
  console.error('Failed to analyze portfolio:', error);
  process.exit(1);
});
