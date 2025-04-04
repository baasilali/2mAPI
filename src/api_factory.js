import CSFloatAPI from './api/csfloat.js';
import SkinPortAPI from './api/skinport.js';
import DMarketAPI from './api/dmarket.js';

export default class ApiFactory {
  static createApi(apiName, apiKey = null) {
    switch (apiName.toLowerCase()) {
      case 'csfloat':
        return new CSFloatAPI(apiKey);
      case 'skinport':
        return new SkinPortAPI(apiKey);
      case 'dmarket':
        return new DMarketAPI(apiKey);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }
}