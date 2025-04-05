import CSFloatAPI from './api/prices/csfloat.js';
import SkinPortAPI from './api/prices/skinport.js';
import DMarketAPI from './api/prices/dmarket.js';
import Buff163API from './api/prices/buff163.js';
import HaloSkinsAPI from './api/prices/haloskins.js';
import SteamAPI from './api/prices/steam.js';

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
      case 'haloskins':
        return new HaloSkinsAPI(apiKey);
      case 'steam':
        return new SteamAPI(apiKey);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }
}