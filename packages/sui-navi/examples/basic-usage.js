import { NaviClient } from '@mcp3/sui-navi';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    // Initialize the client
    const client = new NaviClient({
      networkType: 'mainnet'
    });

    // Get pool information
    console.log('Getting pool information...');
    const poolInfo = await client.getPoolInfo();
    console.log(`Found ${poolInfo.length} pools`);
    
    // Print the first pool
    if (poolInfo.length > 0) {
      console.log('First pool details:');
      console.log(JSON.stringify(poolInfo[0], null, 2));
    }

    // Get health factor for an address (replace with a real address)
    const address = '0x123...'; // Replace with a real address
    console.log(`\nGetting health factor for ${address}...`);
    try {
      const healthFactor = await client.getHealthFactor(address);
      console.log('Health factor details:');
      console.log(JSON.stringify(healthFactor, null, 2));
    } catch (error) {
      console.log(`Error getting health factor: ${error.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error);
