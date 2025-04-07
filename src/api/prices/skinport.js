import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

export default class SkinPortAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("SkinPort", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const filePath = path.resolve(process.cwd(), 'data/skinport/skinport_data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = [];
    for (const marketHashName of marketHashNames) {
      const item = data.find(item => item.market_hash_name === marketHashName);
      if (item) {
        console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
        result.push({ market_hash_name: item.market_hash_name, price: item.min_price });
      } else {
        console.warn(chalk.yellow(`${this.prefix}: No data found for ${marketHashName}`));
      }
    }
    return result;
  }


  formatData(data) {
    return data.map(item => ({
      ...item,
      source: 'SkinPort'
    }));
  }

  async writeToJson(data) {
    const filePath = path.resolve(process.cwd(), 'prices_output.json');
    
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}', 'utf8');
      }
      
      await lockfile.lock(filePath, { retries: 5, retryWait: 1000 });
      
      let existingData = {};
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`${this.prefix}: Error reading prices_output.json: ${error.message}`);
      }
      
      // Process data to create the proper structure
      for (const item of data) {
        if (!existingData[item.market_hash_name]) {
          existingData[item.market_hash_name] = {};
        }
        
        existingData[item.market_hash_name][this.apiName] = {
          price: item.price,
          ...Object.fromEntries(
            Object.entries(item).filter(([key]) => 
              !['market_hash_name', 'source'].includes(key) && key !== 'price'
            )
          )
        };
      }
      
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      console.log(`${this.prefix}: Successfully wrote data to prices_output.json`);
    } catch (error) {
      console.error(`${this.prefix}: Error writing to prices_output.json: ${error.message}`);
    } finally {
      try {
        await lockfile.unlock(filePath);
      } catch (unlockError) {
        console.error(`${this.prefix}: Error unlocking file: ${unlockError.message}`);
      }
    }
  }
} 

(async () => {
  const skinportApi = new SkinPortAPI(process.env.SKIN_PORT_API_KEY);

  const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
  const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const data = await skinportApi.fetchPrices(marketHashNames);
  const formatted_data = skinportApi.formatData(data);

  await skinportApi.writeToJson(formatted_data);
})();