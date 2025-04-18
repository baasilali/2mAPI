import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class SkinPortAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("SkinPort", apiKey);

    const filePath = path.resolve(process.cwd(), 'data/skinport/skinport_data.json');
    this.skinportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  fetchPrice(marketHashName) {
    const item = this.skinportData.find(item => item.market_hash_name === marketHashName);
    if (item && item.min_price) {
      console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
      const data = { 
        market_hash_name: item.market_hash_name, 
        price: item.min_price, 
        source: 'SkinPort' 
      };
      return data;
    } else {
      console.warn(chalk.yellow(`${this.prefix}: No data found for ${marketHashName}`));
      return null;
    }
  }

  formatData(data) {
    return data.map(item => ({
      ...item,
      source: 'SkinPort'
    }));
  }

  async saveSkinportDataFile() {
    try {
      console.log(`${this.prefix}: Fetching skinport_data.json`);

      const response = await fetch('https://api.skinport.com/v1/items?app_id=730&currency=USD&tradable=true', {
        method: 'GET',
        headers: {
          'Accept-Encoding': 'br'
        }
      });
      
      const data = await response.json();
      
      const dirPath = path.resolve(process.cwd(), 'data/skinport');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      const filePath = path.resolve(dirPath, 'skinport_data.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`${this.prefix}: Successfully saved data to skinport_data.json`);
    } catch (error) {
      console.error(`${this.prefix}: Error fetching or saving data: ${error.message}`);
    }
  }
}

(async () => {
  const skinportApi = new SkinPortAPI(null);

  while(true) {
    await skinportApi.saveSkinportDataFile();
    await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 5));
  }
})();