import SkinPriceAPI from './skinprice.js';

export default class CSFloatAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("CSFloat", apiKey);
  }

  async fetchPrices() {
    try {
      const url = 'https://csfloat.com/api/v1/listings?page=0&limit=50&sort_by=lowest_price&category=0&type=buy_now&def_index=16';
      const response = await fetch(url, {
        headers: { 'Authorization': `${this.apiKey}` }
      });
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from CSFloat API: ${error.message}`);
      throw error;
    }
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
      }));
    } catch (error) {
      console.error(`Error formatting CSFloat data: ${error.message}`);
      return [];
    }
  }
} 