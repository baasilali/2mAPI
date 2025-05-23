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