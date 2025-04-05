export default class InventoryAPI {
  constructor() {
    this.prefix = '[InventoryAPI]';
  }

  async fetchInventory(steamID) {
    const url = `https://steamcommunity.com/inventory/${steamID}/730/2?count=9999&language=english`;
    const response = await fetch(url);
    const data = await response.json();

    let inspect_links = [];

    for (const item of data.descriptions) {
      inspect_links.push(item.market_actions.link);
    }
      

    const formatted_data = {
      inspect_links: inspect_links
    };
    return formatted_data;
  }
}
  