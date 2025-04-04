import SkinPriceAPI from './skinprice.js';

import DMarketApiClient from '../utils/dmarket_signature.js';

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export default class DMarketAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("DMarket", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const dmarket = new DMarketApiClient(process.env.DMARKET_PUBLIC_KEY, process.env.DMARKET_SECRET_KEY);

    const results = [];
    for (const marketHashName of marketHashNames) {
      const params = {
        gameId: "a8db",
        title: marketHashName,
        currency: "USD",
        orderDir: "asc",
        limit: 1
      };

      const signedRequest = dmarket.generateRequest("/exchange/v1/market/items", params);

      try {
        const response = await fetch(signedRequest.url, {
          method: signedRequest.method,
          headers: signedRequest.headers
        });
        
        const data = await response.json();
        console.log(`${this.prefix}: Found value for ${marketHashName}`);

        const formatted_data = {
            market_hash_name: marketHashName,
            price: data.objects[0].price.USD,
            floatValue: data.objects[0].extra.floatValue,
            quality: data.objects[0].extra.quality,
            paintIndex: data.objects[0].extra.paintIndex,
            paintSeed: data.objects[0].extra.paintSeed,
            category: data.objects[0].extra.category,
            source: 'DMarket'
        }

        results.push(formatted_data);
      } catch (error) {
        console.error(`${this.prefix}: Error fetching prices for ${marketHashName}: ${error.message}`);
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
} 