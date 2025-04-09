import SkinPriceAPI from './skinprice.js';

import DMarketApiClient from '../../utils/dmarket_signature.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import dotenv from 'dotenv';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class DMarketAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("DMarket", apiKey);
    this.index = 0;
    this.dmarketSigClient = new DMarketApiClient(process.env.DMARKET_PUBLIC_KEY, process.env.DMARKET_SECRET_KEY);
  }

  async fetchPrice(marketHashName) {
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

      if(!data || !data.objects || data.objects.length === 0) {
        console.warn(chalk.yellow(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`));
        return null;
      }

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

      return formatted_data;
    } catch (error) {
      console.error(chalk.red(`${this.prefix}: Error fetching prices for ${marketHashName}: ${error.message}`));
    }
    this.index++;
    return null;
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
  const dmarketApi = new DMarketAPI(null);
  const marketHashNames = workerData;

  while(true) {
    let results = [];
    for(let i = 0; i < marketHashNames.length; i++) {
      if(i % 200 === 0 && i !== 0) {
        await dmarketApi.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = [];
      }
      const marketHashName = marketHashNames[i];
      const data = await dmarketApi.fetchPrice(marketHashName);
      if(!data) {
        continue;
      }
      results.push(data);
    }
    await dmarketApi.writeToJson(results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();