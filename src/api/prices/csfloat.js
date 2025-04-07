import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class CSFloatAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("CSFloat", apiKey);
    this.rateLimit = false;
  }

  async fetchPrices(marketHashNames) {
    const indexFilePath = path.resolve(process.cwd(), 'src/api/data/csfloat/csfloat_api_index.txt');
    let index = parseInt(fs.readFileSync(indexFilePath, 'utf8'));
    
    const results = [];
    for (const marketHashName of marketHashNames) {
      const url = `https://csfloat.com/api/v1/listings?page=0&limit=1&sort_by=lowest_price&market_hash_name=${marketHashName}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `${this.apiKey}` }
      });
      const data = await response.json();
      if(data.code === 20) {
        fs.writeFileSync(indexFilePath, (index + 1).toString());
        console.error(chalk.red(`${this.prefix}: Rate limit hit when searching for: ${marketHashName}`));
        this.rateLimit = true;
        break;
      }
      if(!data || !data.data || data.data.length === 0) {
        console.warn(chalk.yellow(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`));
        index++;
        continue;
      }
      index++;
      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));

      const formatted_data = {
        market_hash_name: marketHashName,
        price: data.data[0].price * 0.01,
        float: data.data[0].item.float_value,
        rarity: data.data[0].item.rarity,

        paint_index: data.data[0].item.paint_index,
        paint_seed: data.data[0].item.paint_seed,
        quality: data.data[0].item.quality,
        stattrak: data.data[0].item.is_stattrak,
        souvenir: data.data[0].item.is_souvenir,
        source: 'CSFloat'
      };

      results.push(formatted_data);
    }
    fs.writeFileSync(indexFilePath, index.toString());
    return results;
  }

  formatData(data) {
    if (!data) {
      console.warn(chalk.yellow(`${this.prefix}: No data found`));
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
  while(true) {
    const csfloatApi = new CSFloatAPI(process.env.CS_FLOAT_API_KEY);

    const marketHashNames = workerData;
  
    const data = await csfloatApi.fetchPrices(marketHashNames);
    const formatted_data = csfloatApi.formatData(data);

    if(csfloatApi.rateLimit) {
      csfloatApi.rateLimit = false;
      await csfloatApi.writeToJson(formatted_data);
      await new Promise(resolve => setTimeout(resolve, 3600000));
    }
  }
})();