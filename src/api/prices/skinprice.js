import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

export default class SkinPriceAPI {
    constructor(apiName, apiKey = null) {
      this.apiName = apiName;
      this.apiKey = apiKey;
      this.prefix = `[${apiName}]`;
    }
  
    async fetchPrices() {
      throw new Error("Each API class must implement the fetchPrices method");
    }
  
    formatData(data) {
      throw new Error("Each API class must implement the formatData method");
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
          const nameWithoutWear = item.market_hash_name.split('(')[0].trim();
          const wearMatch = item.market_hash_name.match(/\((.*?)\)$/);
          const wearCondition = wearMatch ? wearMatch[1] : '';
  
          if (!existingData[nameWithoutWear]) {
            existingData[nameWithoutWear] = {};
          }
          
          if (!existingData[nameWithoutWear][wearCondition]) {
            existingData[nameWithoutWear][wearCondition] = {};
          }
          
          existingData[nameWithoutWear][wearCondition][this.apiName] = {
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
        console.log(error);
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