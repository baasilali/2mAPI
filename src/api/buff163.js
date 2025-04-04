import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export default class Buff163API extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Buff163", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const results = [];
    for (const marketHashName of marketHashNames) {
      const url = `https://buff.163.com/api/market/goods?game=csgo&page_num=1&tab=selling&use_suggestion=0&_=1743754675064&page_size=1&sort_by=price.asc&search=${marketHashName}`;

      const request = new Request(url, {
        headers: {
          "Cookie": process.env.BUFF163_COOKIE,
        }
      });

      const response = await fetch(request);
      const data = await response.json();

      if(!data || data.data.items.length === 0) {
        console.log(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`);
        continue;
      }

      const formatted_result = {
        market_hash_name: marketHashName,
        price: data.data.items[0].sell_reference_price,
        source: 'Buff163'
      };


      console.log(`${this.prefix}: Found value for ${marketHashName}`);
      results.push(formatted_result);
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