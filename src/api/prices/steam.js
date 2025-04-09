import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class SteamAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Steam", apiKey);

    const nameidFilePath = path.resolve(process.cwd(), 'data/steam/cs2_item_nameid.json');
    this.nameIdData = JSON.parse(fs.readFileSync(nameidFilePath, 'utf8'));

    this.missingNameids = this.loadMissingNameIdFile();
  }

  async loadMissingNameIdFile() {
    const missingNameidDir = path.resolve(process.cwd(), 'src/api/data/steam');
    const missingNameidPath = path.join(missingNameidDir, 'missing_nameid.json');

    if (!fs.existsSync(missingNameidDir)) {
      fs.mkdirSync(missingNameidDir, { recursive: true });
    }
    
    let missingNameids = {};
    if (fs.existsSync(missingNameidPath)) {
      try {
        missingNameids = JSON.parse(fs.readFileSync(missingNameidPath, 'utf8'));
      } catch (err) {
        console.error(chalk.red(`${this.prefix}: Error reading missing_nameid.json: ${err.message}`));
        missingNameids = null;
      }
    }

    return missingNameids;
  }

  async fetchPrice(marketHashName) {  
    try {
      const item_nameid = this.nameIdData[marketHashName];
      
      if (!item_nameid) {
        console.error(chalk.red(`${this.prefix}: No item_nameid found in 'cs2_item_nameid.json' for market_hash_name: ${marketHashName}`));
        this.missingNameids[marketHashName] = 1;

        const missingNameidDir = path.resolve(process.cwd(), 'src/api/data/steam');
        const missingNameidPath = path.join(missingNameidDir, 'missing_nameid.json');

        fs.writeFileSync(missingNameidPath, JSON.stringify(this.missingNameids, null, 2));
        return null;
      }
      
      const url = `https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=1&item_nameid=${item_nameid}`;
    
      const response = await fetch(url);
      const data = await response.json();
    
      if (!data || !data.lowest_sell_order) {
        console.error(chalk.red(`${this.prefix}: No price data found for market_hash_name: ${marketHashName}`));
        return null;
      }
    
      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
      
      // Avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 100));

      return {
        market_hash_name: marketHashName,
        price: data.lowest_sell_order * 0.01,
        source: 'Steam'
      };
    } catch (error) {
      console.error(chalk.red(`${this.prefix}: Error fetching price for ${marketHashName}: ${error.message}`));
    }

    return null;
  }

  formatData(data) {
    if (!data) {
        console.log(`${this.prefix}: No data found`);
        return [];
      }
      return data;
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
} 

(async () => {
  const steamApi = new SteamAPI(null);
  const marketHashNames = workerData;

  while(true) {
    let results = [];

    for(let i = 0; i < marketHashNames.length; i++) {
      if(i % 200 === 0 && i !== 0) {
        await steamApi.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = [];
      }
      const marketHashName = marketHashNames[i];
      const data = await steamApi.fetchPrice(marketHashName);
      if(!data) {
        continue;
      }
      results.push(data);
    }
    await steamApi.writeToJson(results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();