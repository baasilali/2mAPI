import nacl from 'tweetnacl';

class DMarketApiClient {
    constructor(publicKey, secretKey) {
      this.publicKey = publicKey;
      this.secretKey = secretKey;
      this.rootApiUrl = "https://api.dmarket.com";
    }
  
    /**
     * Builds a request path with query parameters
     * @param {string} basePath - The base API endpoint path
     * @param {Object} params - Key-value pairs of query parameters
     * @returns {string} The complete request path with params
     */
    buildRequestPath(basePath, params) {
      if (!params || Object.keys(params).length === 0) {
        return basePath;
      }
  
      let requestPath = basePath.includes('?') ? basePath : basePath + '?';
      
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          for (const item of value) {
            requestPath += `${key}=${item}&`;
          }
        } else {
          requestPath += `${key}=${value}&`;
        }
      }
  
      // Remove trailing '&' character
      return requestPath.slice(0, -1);
    }
  
    /**
     * Generates signature for a DMarket API request
     * @param {string} method - HTTP method (GET, POST, etc.)
     * @param {string} requestPath - Full request path including query params
     * @param {string} nonce - Timestamp as string
     * @returns {string} The generated signature
     */
    generateSignature(method, requestPath, nonce) {
      const stringToSign = method + requestPath + nonce;
      const encoder = new TextEncoder();
      const encodedMessage = encoder.encode(stringToSign);
      const secretBytes = this.hexToUint8Array(this.secretKey);
      
      // Using the tweetnacl-js library for ed25519 signing
      // You'll need to include this library in your project
      const signature = nacl.sign.detached(encodedMessage, secretBytes);
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  
    /**
     * Converts a hex string to Uint8Array
     * @param {string} hexString - Hex string to convert
     * @returns {Uint8Array} The resulting array
     */
    hexToUint8Array(hexString) {
      return new Uint8Array(
        hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
      );
    }
  
    /**
     * Generates the request with signed headers
     * @param {string} requestPath - The API endpoint path
     * @param {Object} params - Key-value pairs of query parameters
     * @param {string} method - HTTP method, defaults to "GET"
     * @returns {Object} Request configuration with headers
     */
    generateRequest(requestPath, params, method = "GET") {
      const fullRequestPath = this.buildRequestPath(requestPath, params);
      const nonce = Math.round(Date.now() / 1000).toString();
      const signature = this.generateSignature(method, fullRequestPath, nonce);
      const signaturePrefix = "dmar ed25519 ";
      const requestSign = signaturePrefix + signature;
      
      return {
        url: this.rootApiUrl + fullRequestPath,
        method: method,
        headers: {
          "X-Api-Key": this.publicKey,
          "X-Request-Sign": requestSign,
          "X-Sign-Date": nonce
        }
      };
    }
  
    // /**
    //  * Example method to fetch items from DMarket
    //  * @param {Object} params - Search parameters
    //  * @returns {Promise} A promise that resolves to the API response
    //  */
    // async fetchItems(params) {
    //   const request = this.generateRequest("/exchange/v1/market/items", params);
      
    //   try {
    //     const response = await fetch(request.url, {
    //       method: request.method,
    //       headers: request.headers
    //     });
        
    //     return await response.json();
    //   } catch (error) {
    //     console.error("Error fetching items:", error);
    //     throw error;
    //   }
    // }
  }

  export default DMarketApiClient;