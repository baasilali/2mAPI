import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

export default class Buff163API extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Buff163", apiKey);
    this.index = 0;
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
      console.error(chalk.red(`${this.prefix}: Error reading yuan_usd_conversion.txt: ${error.message}`));
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

        if (data.code === 'Login Required') {
          console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}. Update the BUFF163_COOKIE environment variable`));
          break;
        }

        if (!data || data.data.items.length === 0) {
          console.warn(chalk.yellow(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`));
          this.index++;
          continue;
        }

        const yuanPrice = data.data.items[0].sell_reference_price;
        const usdPrice = yuanPrice * conversionRate;

        const formatted_result = {
          market_hash_name: marketHashName,
          price: usdPrice,
          source: 'Buff163'
        };

        console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
        this.index++;
        results.push(formatted_result);
      } catch (error) {
        console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}: ${error.message}`));
        this.index++;
      }
    }
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
    const buff163Api = new Buff163API(null);

    const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
    const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
    const data = await buff163Api.fetchPrices(marketHashNames);
    const formatted_data = buff163Api.formatData(data);

    if(buff163Api.index % 200 === 0) {
      await buff163Api.writeToJson(formatted_data);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
})();