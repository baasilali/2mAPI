import dotenv from 'dotenv';

dotenv.config();

export default class InventoryAPI {
  constructor() {
    this.prefix = '[InventoryAPI]';
  }

  async fetchInventory(steamID) {
    const steam_url = `https://steamcommunity.com/inventory/${steamID}/730/2?l=english&count=5000`

    const steam_request = new Request(steam_url);

    const steam_response = await fetch(steam_request);
    const steam_data = await steam_response.json();

    let assetid_map = new Map();

    let inventory_data = [];
    let inspect_links = [];

    if(!steam_data || !steam_data.assets || !steam_data.descriptions) {
      console.log(`${this.prefix}: No assets or descriptions found for steamID: ${steamID}`);
      return [];
    }

    for(const item of steam_data.assets) {
      if(item.assetid) {
        assetid_map.set(item.classid, item.assetid);
      }
    }

    for(const item of steam_data.descriptions) {
      if(item.actions && item.actions[0]) {
        const inspect_url = item.actions[0].link.replace('%assetid%', assetid_map.get(item.classid)).replace('%owner_steamid%', steamID);
        inspect_links.push(inspect_url);
      }
    }

    for (const link of inspect_links) {
        const csfloat_url = `https://api.csfloat.com/?url=${link}`;

        const csfloat_request = new Request(csfloat_url, {
          headers: {
            'Referer': 'https://csfloat.com/',
            'Origin': 'https://csfloat.com'
          }
        });

        const csfloat_response = await fetch(csfloat_request);
        const float_data = await csfloat_response.json();

        if(!float_data || !float_data.iteminfo) {
            console.log(`${this.prefix}: No float data found for link: ${link}`);
            continue;
        }

        const return_data = {
            market_hash_name: float_data.iteminfo.full_item_name,
            float: float_data.iteminfo.floatvalue,
            float_id: float_data.iteminfo.floatid,
            stickers: float_data.iteminfo.stickers?.map(sticker => sticker.name) || [],
            paint_index: float_data.iteminfo.paintindex,
            paint_seed: float_data.iteminfo.paintseed,
            rarity: float_data.iteminfo.rarity,
            quality: float_data.iteminfo.quality,  
        };

        inventory_data.push(return_data);
    }

    return inventory_data;
  }
}
  