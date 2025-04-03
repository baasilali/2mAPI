import SkinPriceAPI from './skinprice.js';

export default class CSFloatAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("CSFloat", apiKey);
  }

    /*
      Write a function that takes an array of market_hash_name strings and calls the url 'https://csfloat.com/api/v1/listings?page=0&limit=1&sort_by=lowest_price&market_hash_name={market_hash_name}' for each market_hash_name.
      After retrieving the response from the url, get the following data from the response json:
      - item_name
      - market_hash_name
      - price
      - float
      - rarity
      - def_index
      - paint_index
      - quality
      - stattrack
      - souvenir
      - source (CSFloat)

      Return an array of objects with the above data. There will be 1 entry for every market_hash_name.
  */
  async fetchPrices(marketHashNames) {
    const results = [];
    for (const marketHashName of marketHashNames) {
      const url = `https://csfloat.com/api/v1/listings?page=0&limit=1&sort_by=lowest_price&market_hash_name=${marketHashName}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `${this.apiKey}` }
      });
      const data = await response.json();
      if(data.code === 20) {
        throw new Error('Rate limit hit');
      }
      if(!data || data.data.length === 0) {
        console.log(`No data found for market_hash_name: ${marketHashName}`);
        continue;
      }
      console.log(data.data[0].item.item_name);
      results.push(this.formatData(data));
    }
    return results;
  }


  formatData(data) {
    try {
      return data.data.map(item => ({
        item_name: item.item.item_name,
        market_hash_name: item.item.market_hash_name,
        price: item.price,
        float: item.item.float_value,
        rarity: item.item.rarity,

        def_index: item.item.def_index,
        paint_index: item.item.paint_index,
        quality: item.item.quality,
        stattrack: item.item.is_stattrak,
        souvenir: item.item.is_souvenir,
        source: 'CSFloat'
      }));
    } catch (error) {
      console.error(`Error formatting CSFloat data: ${error.message}`);
      return [];
    }
  }
} 