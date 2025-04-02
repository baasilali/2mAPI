import CSFloatAPI from './apis/csfloat.js';
import SkinPriceAPI from './apis/skinprice.js';

export default class ApiFactory {
  /**
   * Create an API instance based on the API name
   * @param {string} apiName The name of the API to create
   * @param {string} apiKey API key for authentication
   * @returns {SkinPriceAPI} Instance of the requested API
   */
  static createApi(apiName, apiKey = null) {
    switch (apiName.toLowerCase()) {
      case 'csfloat':
        return new CSFloatAPI(apiKey);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }
}