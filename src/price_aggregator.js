import CSFloatAPI from './apis/csfloat.js';
import SkinPriceAPI from './apis/skinprice.js'; // Assuming SkinPriceAPI is the base class

export default class PriceAggregator {
  constructor() {
    this.apis = [];
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
        const rawData = await api.fetchPrices();
        const formattedData = api.formatData(rawData);

        console.log(formattedData);

        formattedData.forEach(item => {
          // Ensure item_name and source are present
          if (item && item.item_name) { 
            item.source = api.apiName; 
          } else {
            console.warn(`Skipping item due to missing data from ${api.apiName}:`, item);
          }
        });
        
        // Filter out items that were skipped
        const validItems = formattedData.filter(item => item && item.item_name && item.source);
        allPrices.push(...validItems);

      } catch (error) {
        console.error(`Error collecting prices from ${api.apiName}: ${error.message}`);
      }
    }

    return allPrices;
  }

  async exportToJson(filename = "skin_prices.json") {
    const prices = await this.collectAllPrices();

    if (!prices.length) {
      console.log("No price data collected.");
      return;
    }

    const jsonData = {};

    prices.forEach(item => {
      // Destructure item, ensuring market_hash_name is used as the key
      const { market_hash_name, source, ...rest } = item; 
      
      if (!market_hash_name || !source) {
        console.warn("Skipping item due to missing market_hash_name or source:", item);
        return; // Skip this item if essential keys are missing
      }

      if (!jsonData[market_hash_name]) {
        jsonData[market_hash_name] = {};
      }

      // Check if the source is CSFloat
      if (source === 'CSFloat') { // Assuming 'CSFloat' is the apiName for CSFloatAPI
        // Initialize the array if it doesn't exist
        if (!Array.isArray(jsonData[market_hash_name][source])) {
          jsonData[market_hash_name][source] = [];
        }
        // Push the item details into the array
        jsonData[market_hash_name][source].push(rest);
      } else {
        // For other APIs, keep the original behavior (overwrite or set)
        jsonData[market_hash_name][source] = rest;
      }
    });

    try {
      const jsonContent = JSON.stringify(jsonData, null, 2); // Pretty print JSON

      // Environment-specific saving logic for JSON
      if (typeof window !== "undefined" && window.document) { // Browser
        const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up Object URL
      } 
      else if (typeof process !== 'undefined' && process.versions && process.versions.node) { // Node.js
         // Dynamically require 'fs' only in Node.js environment
        const fs = await import('fs');
        fs.writeFileSync(filename, jsonContent);
        console.log(`Price data exported to ${filename}`);
      } else {
          console.error("Unsupported environment for file export.");
      }
    } catch (error) {
      console.error(`Error exporting to JSON: ${error.message}`);
    }
  }
}