import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';

export default class CSFloatAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("CSFloat", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const indexFilePath = path.resolve(process.cwd(), 'src/api/data/csfloat/csfloat_api_index.txt');
    let index = parseInt(fs.readFileSync(indexFilePath, 'utf8'));
    
    const results = [];
    for (const marketHashName of marketHashNames.slice(index)) {
      const url = `https://csfloat.com/api/v1/listings?page=0&limit=1&sort_by=lowest_price&market_hash_name=${marketHashName}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `${this.apiKey}` }
      });
      const data = await response.json();
      if(data.code === 20) {
        fs.writeFileSync(indexFilePath, (index + 1).toString());
        console.log(`${this.prefix}: Rate limit hit when searching for: ${marketHashName}`);
        break;
      }
      if(!data || data.data.length === 0) {
        console.log(`${this.prefix}: No data found for market_hash_name: ${marketHashName}`);
        index++;
        continue;
      }
      index++;
      console.log(`${this.prefix}: Found value for ${marketHashName}`);

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
      console.log(`${this.prefix}: No data found`);
      return [];
    }
    return data;
  }
} 