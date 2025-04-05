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
  }