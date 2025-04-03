import SkinPriceAPI from './skinprice.js';

export default class SkinPortAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("SkinPort", apiKey);
  }

  async fetchPrices(marketHashNames) {

  }


  formatData(data) {

  }
} 