import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

export default class SteamAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Steam", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const results = [];
    const nameidFilePath = path.resolve(process.cwd(), 'data/steam/cs2_item_nameid.json');
    const nameidData = JSON.parse(fs.readFileSync(nameidFilePath, 'utf8'));
  
    for (const marketHashName of marketHashNames) {
      try {
        const item_nameid = nameidData[marketHashName];
        
        if (!item_nameid) {
          console.error(chalk.red(`${this.prefix}: No item_nameid found in 'cs2_item_nameid.json' for market_hash_name: ${marketHashName}`));
          
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
            }
          }
          
          missingNameids[marketHashName] = 1;
          
          fs.writeFileSync(missingNameidPath, JSON.stringify(missingNameids, null, 2));
          
          continue;
        }
        
        const url = `https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=1&item_nameid=${item_nameid}`;
      
        const response = await fetch(url);
        const data = await response.json();
      
        if (!data || !data.lowest_sell_order) {
          console.error(chalk.red(`${this.prefix}: No price data found for market_hash_name: ${marketHashName}`));
          continue;
        }
      
        console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
      
        results.push({
          market_hash_name: marketHashName,
          price: data.lowest_sell_order * 0.01,
          source: 'Steam'
        });
      
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(chalk.red(`${this.prefix}: Error fetching price for ${marketHashName}: ${error.message}`));
      }
    }
  
    return results;
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
  const steamApi = new SteamAPI(null);

  const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
  const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const data = await steamApi.fetchPrices(marketHashNames);
  const formatted_data = steamApi.formatData(data);

  await steamApi.writeToJson(formatted_data);
})();