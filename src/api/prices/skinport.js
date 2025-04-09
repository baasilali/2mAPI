import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class SkinPortAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("SkinPort", apiKey);

    const filePath = path.resolve(process.cwd(), 'data/skinport/skinport_data.json');
    this.skinportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  fetchPrice(marketHashName) {
    const item = this.skinportData.find(item => item.market_hash_name === marketHashName);
    if (item && item.min_price) {
      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
      const data = { 
        market_hash_name: item.market_hash_name, 
        price: item.min_price, 
        source: 'SkinPort' 
      };
      return data;
    } else {
      console.warn(chalk.yellow(`${this.prefix}: No data found for ${marketHashName}`));
      return null;
    }
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
      
      for (const item of data) {
        const nameWithoutWear = item.market_hash_name.split('(')[0].trim();
        const wearMatch = item.market_hash_name.match(/\((.*?)\)$/);
        const wearCondition = wearMatch ? wearMatch[1] : '';

        if (!existingData[nameWithoutWear]) {
          existingData[nameWithoutWear] = {};
        }
        
        if (!existingData[nameWithoutWear][wearCondition]) {
          existingData[nameWithoutWear][wearCondition] = {};
        }
        
        existingData[nameWithoutWear][wearCondition][this.apiName] = {
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

  async saveSkinportDataFile() {
    try {
      const response = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=USD&tradable=true', {
        method: 'GET',
        headers: {
          'Accept-Encoding': 'br'
        }
      });
      
      const data = await response.json();
      
      const dirPath = path.resolve(process.cwd(), 'data/skinport');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.resolve(dirPath, 'skinport_data.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`${this.prefix}: Successfully saved data to skinport_data.json`);
    } catch (error) {
      console.error(`${this.prefix}: Error fetching or saving data: ${error.message}`);
    }
  }
}

(async () => {
  const skinportApi = new SkinPortAPI(null);
  const marketHashNames = workerData;

  while(true) {
    await skinportApi.saveSkinportDataFile();
    let results = [];

    for(let i = 0; i < marketHashNames.length; i++) {
      if(i % 200 === 0 && i !== 0) {
        await skinportApi.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = [];
      }

      const marketHashName = marketHashNames[i];
      const data = skinportApi.fetchPrice(marketHashName);

      if(!data) {
        continue;
      }

      results.push(data);
    }
    await skinportApi.writeToJson(results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();