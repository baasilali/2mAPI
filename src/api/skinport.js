import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';

export default class SkinPortAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("SkinPort", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const filePath = path.resolve(process.cwd(), 'data/skinport/skinport_data.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = [];
    for (const marketHashName of marketHashNames) {
      const item = data.find(item => item.market_hash_name === marketHashName);
      if (item) {
        result.push({ market_hash_name: item.market_hash_name, price: item.min_price });
      }
    }
    return result;
  }


  formatData(data) {
    return data.map(item => ({
      ...item,
      source: 'SkinPort'
    }));
  }
} 