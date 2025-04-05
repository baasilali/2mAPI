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
    
    let conversionRate = 0;
    try {
      const conversionFilePath = path.resolve(process.cwd(), 'src/api/data/buff163/yuan_usd_conversion.txt');
      if (fs.existsSync(conversionFilePath)) {
        const conversionData = fs.readFileSync(conversionFilePath, 'utf8').trim();
        conversionRate = parseFloat(conversionData);
        if (isNaN(conversionRate)) {
          throw new Error(`${this.prefix}: Conversion rate is not a valid number`);
        }
      } else {
        throw new Error(`${this.prefix}: Yuan to USD conversion file does not exist`);
      }
    } catch (error) {
      console.error(`${this.prefix}: Error reading yuan_usd_conversion.txt: ${error.message}`);
      return [];
    }
    
    for (const marketHashName of marketHashNames) {
      const url = `https://buff.163.com/api/market/goods?game=csgo&page_num=1&tab=selling&use_suggestion=0&_=1743754675064&page_size=1&sort_by=price.asc&search=${marketHashName}`;

      const request = new Request(url, {
        headers: {
          "Cookie": process.env.BUFF163_COOKIE,
        }
      });

      try {
        const response = await fetch(request);
        const data = await response.json();

        if(data.code === 'Login Required') {
          console.log(`${this.prefix}: Error fetching data for ${marketHashName}. Update the BUFF163_COOKIE environment variable`);
          break;
        }

        if(!data || data.data.items.length === 0) {
          console.log(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`);
          continue;
        }

        const yuanPrice = data.data.items[0].sell_reference_price;
        const usdPrice = yuanPrice * conversionRate;

        const formatted_result = {
          market_hash_name: marketHashName,
          price: usdPrice,
          source: 'Buff163'
        };

        console.log(`${this.prefix}: Found value for ${marketHashName}`);
        results.push(formatted_result);
      } catch (error) {
        console.error(`${this.prefix}: Error fetching data for ${marketHashName}: ${error.message}`);
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