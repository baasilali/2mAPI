import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';

export default class SteamAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("Steam", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const results = [];
    const nameidFilePath = path.resolve(process.cwd(), 'data/steam/cs2_item_nameid.json');
    const nameidData = JSON.parse(fs.readFileSync(nameidFilePath, 'utf8'));
  
    for (const marketHashName of marketHashNames) {
      try {
        const item_nameid = nameidData[marketHashName];
        
        if (!item_nameid) {
          console.log(`${this.prefix}: No item_nameid found in 'cs2_item_nameid.json' for market_hash_name: ${marketHashName}`);
          
          const missingNameidDir = path.resolve(process.cwd(), 'src/api/data/steam');
          const missingNameidPath = path.join(missingNameidDir, 'missing_nameid.json');
          
          if (!fs.existsSync(missingNameidDir)) {
            fs.mkdirSync(missingNameidDir, { recursive: true });
          }
          
          let missingNameids = {};
          if (fs.existsSync(missingNameidPath)) {
            try {
              missingNameids = JSON.parse(fs.readFileSync(missingNameidPath, 'utf8'));
            } catch (err) {
              console.error(`${this.prefix}: Error reading missing_nameid.json: ${err.message}`);
            }
          }
          
          missingNameids[marketHashName] = 1;
          
          fs.writeFileSync(missingNameidPath, JSON.stringify(missingNameids, null, 2));
          
          continue;
        }
        
        const url = `https://steamcommunity.com/market/itemordershistogram?country=US&language=english&currency=1&item_nameid=${item_nameid}`;
      
        const response = await fetch(url);
        const data = await response.json();
      
        if (!data || !data.lowest_sell_order) {
          console.log(`${this.prefix}: No price data found for market_hash_name: ${marketHashName}`);
          continue;
        }
      
        console.log(`${this.prefix}: Found value for ${marketHashName}`);
      
        results.push({
          market_hash_name: marketHashName,
          price: data.lowest_sell_order * 0.01,
          source: 'Steam'
        });
      
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`${this.prefix}: Error fetching price for ${marketHashName}: ${error.message}`);
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