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

  getIndex() {
    const indexFilePath = path.resolve(process.cwd(), 'src/api/data/csfloat/csfloat_api_index.txt');
    return parseInt(fs.readFileSync(indexFilePath, 'utf8'));
  }

  saveIndex(index) {
    const indexFilePath = path.resolve(process.cwd(), 'src/api/data/csfloat/csfloat_api_index.txt');
    fs.writeFileSync(indexFilePath, index.toString());
  }

  async fetchPrice(marketHashName) {    
    const url = `https://csfloat.com/api/v1/listings?page=0&limit=1&sort_by=lowest_price&market_hash_name=${marketHashName}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `${this.apiKey}` }
    });
    const data = await response.json();

    if(data.code === 20) {
      console.error(chalk.red(`${this.prefix}: Rate limit hit when searching for: ${marketHashName}`));
      this.rateLimit = true;
      return null;
    }
    if(!data || !data.data || data.data.length === 0) {
      console.warn(chalk.yellow(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`));
      return null;
    }
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

    return formatted_data;
  }

  formatData(data) {
    if (!data) {
      console.warn(chalk.yellow(`${this.prefix}: No data found`));
      return [];
    }
    return data;
  }
} 

(async () => {
  const csfloatApi = new CSFloatAPI(process.env.CS_FLOAT_API_KEY);
  const marketHashNames = workerData;
  while(true) {
    let results = [];

    let index = await csfloatApi.getIndex();

    if(index >= marketHashNames.length) {
      index = 0;
    }

    for(let i = index; i < marketHashNames.length; i++) {
      if(i % 200 === 0 && i !== 0) {
        await csfloatApi.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = [];
      }
      
      const marketHashName = marketHashNames[i];
      const data = await csfloatApi.fetchPrice(marketHashName);

      if(csfloatApi.rateLimit) {
        csfloatApi.rateLimit = false;
        await csfloatApi.saveIndex(i);

        if(results.length > 0) {
          await csfloatApi.writeToJson(results);
        }

        // Wait for rate limit
        console.warn(chalk.red(`${csfloatApi.prefix}: Rate limit hit, waiting for 1 hour`));
        await new Promise(resolve => setTimeout(resolve, 3600000));
      }

      if(!data) {
        continue;
      }

      results.push(data);
    }
    await csfloatApi.writeToJson(results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();