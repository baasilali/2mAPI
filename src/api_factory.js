import CSFloatAPI from './api/csfloat.js';
import SkinPortAPI from './api/skinport.js';
import DMarketAPI from './api/dmarket.js';
import Buff163API from './api/buff163.js';

export default class ApiFactory {
  static createApi(apiName, apiKey = null) {
    switch (apiName.toLowerCase()) {
      case 'csfloat':
        return new CSFloatAPI(apiKey);
      case 'skinport':
        return new SkinPortAPI(apiKey);
      case 'dmarket':
        return new DMarketAPI(apiKey);
      case 'buff163':
        return new Buff163API(apiKey);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }
}