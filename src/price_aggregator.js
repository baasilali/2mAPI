import SkinPriceAPI from './api/skinprice.js'

export default class PriceAggregator {
  constructor(marketHashNames) {
    this.apis = [];
    this.marketHashNames = marketHashNames;
  }

  addApi(api) {
    if (!(api instanceof SkinPriceAPI)) {
      throw new TypeError("API must be an instance of SkinPriceAPI");
    }
    this.apis.push(api);
  }

  async collectAllPrices() {
    const allPrices = [];

    for (const api of this.apis) {
      try {
        const rawData = await api.fetchPrices(this.marketHashNames);
        const formattedData = api.formatData(rawData);
        
        allPrices.push(...formattedData);

      } catch (error) {
        console.log(error);
        console.error(`Error collecting prices from ${api.apiName}: ${error.message}`);
      }
    }

    return allPrices;
  }

  async exportToJson() {
    const filename = "prices_output.json";
    const prices = await this.collectAllPrices();

    if (!prices.length) {
      console.log("No new price data collected."); 
      return;
    }

    const jsonData = {}; 

    prices.forEach(item => {
      const { market_hash_name, source, ...rest } = item; 
      
      if (!market_hash_name || !source) {
        console.warn("Skipping item due to missing market_hash_name or source:", item);
        return; 
      }

      if (!jsonData[market_hash_name]) {
        jsonData[market_hash_name] = {};
      }

      jsonData[market_hash_name][source] = rest;
    });

    try {
      if (typeof window !== "undefined" && window.document) { 
        const jsonContent = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
        console.log(`Price data prepared for download as ${filename}`);
      } 
      else if (typeof process !== 'undefined' && process.versions && process.versions.node) { 
        const fs = await import('fs').then(m => m.default || m); 
        let fileData = {}; 

        try {
          if (fs.existsSync(filename)) {
            const fileContent = fs.readFileSync(filename, 'utf-8');
            if (fileContent) { 
              fileData = JSON.parse(fileContent);
            }
          }
        } catch (readError) {
          console.error(`Error reading or parsing existing file ${filename}: ${readError.message}. Will overwrite or create a new file.`);
          fileData = {}; 
        }

        Object.keys(jsonData).forEach(market_hash_name => {
          if (!fileData[market_hash_name]) {
            fileData[market_hash_name] = jsonData[market_hash_name];
          } else {
            Object.keys(jsonData[market_hash_name]).forEach(source => {
              const newData = jsonData[market_hash_name][source];
              fileData[market_hash_name][source] = newData;
            });
          }
        });

        try {
          const jsonContent = JSON.stringify(fileData, null, 2);
          fs.writeFileSync(filename, jsonContent);
          console.log(`Price data exported to ${filename}`); 
        } catch (writeError) {
          console.error(`Error writing to ${filename}: ${writeError.message}`);
        }
      } else {
          console.error("Unsupported environment for file export.");
      }
    } catch (error) {
      console.error(`Error during export process: ${error.message}`); 
    }
  }
}