import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class Buff163API extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Buff163", apiKey);
  }

  async fetchPrice(marketHashName, conversionRate) {
    const url = `https://buff.163.com/api/market/goods?game=csgo&page_num=1&tab=selling&use_suggestion=0&_=1743754675064&page_size=1&sort_by=price.asc&search=${marketHashName}`;

    const request = new Request(url, {
      headers: {
        "Cookie": process.env.BUFF163_COOKIE,
      }
    });

    try {
      const response = await fetch(request);
      const data = await response.json();

      if (data.code === 'Login Required') {
        console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}. Update the BUFF163_COOKIE environment variable`));
        return null;
      }

      if (!data || data.data.items.length === 0) {
        console.warn(chalk.yellow(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`));
        return null;
      }

      const yuanPrice = data.data.items[0].sell_reference_price;
      const usdPrice = yuanPrice * conversionRate;

      const formatted_result = {
        market_hash_name: marketHashName,
        price: usdPrice,
        source: 'Buff163'
      };

      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
      return formatted_result;
    } catch (error) {
      console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}: ${error.message}`));
      return null;
    }
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
  const buff163Api = new Buff163API(null);
  const marketHashNames = workerData;

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
    console.error(chalk.red(`${this.prefix}: Error reading yuan_usd_conversion.txt: ${error.message}`));
    return [];
  }

  while(true) {
    let results = [];
    for(let i = 0; i < marketHashNames.length; i++) {
      if(i % 200 === 0 && i !== 0) {
        await buff163Api.writeToJson(results);
        await new Promise(resolve => setTimeout(resolve, 1000));
        results = [];
      }
      const marketHashName = marketHashNames[i];
      const data = await buff163Api.fetchPrice(marketHashName, conversionRate);
      if(!data) {
        continue;
      }
      results.push(data);
    }
    await buff163Api.writeToJson(results);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();