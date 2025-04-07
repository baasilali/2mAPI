import SkinPriceAPI from './skinprice.js';

import DMarketApiClient from '../../utils/dmarket_signature.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

export default class DMarketAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("DMarket", apiKey);
    this.index = 0;
    this.dmarketSigClient = new DMarketApiClient(process.env.DMARKET_PUBLIC_KEY, process.env.DMARKET_SECRET_KEY);
  }

  async fetchPrice(marketHashName) {
    const result = [];

    const params = {
      gameId: "a8db",
      title: marketHashName,
      currency: "USD",
      orderDir: "asc",
      limit: 1
    };

    const signedRequest = this.dmarketSigClient.generateRequest("/exchange/v1/market/items", params);

    try {
      const response = await fetch(signedRequest.url, {
        method: signedRequest.method,
        headers: signedRequest.headers
      });
      
      const data = await response.json();
      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));

      const formatted_data = {
          market_hash_name: marketHashName,
          price: data.objects[0].price.USD * 0.01,
          floatValue: data.objects[0].extra.floatValue,
          quality: data.objects[0].extra.quality,
          paintIndex: data.objects[0].extra.paintIndex,
          paintSeed: data.objects[0].extra.paintSeed,
          category: data.objects[0].extra.category,
          source: 'DMarket'
      }

      result.push(formatted_data);
    } catch (error) {
      console.error(chalk.red(`${this.prefix}: Error fetching prices for ${marketHashName}: ${error.message}`));
    }
    this.index++;
    return result;
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
    const dmarketApi = new DMarketAPI(null);

    const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
    const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let results = [];
    for(let i = 0; i < marketHashNames.length; i++) {
      if(i % 200 === 0) {
        await dmarketApi.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const marketHashName = marketHashNames[i];
      const data = await dmarketApi.fetchPrice(marketHashName);
      results.push(data);
    }
  }
})();