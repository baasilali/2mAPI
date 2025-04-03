import PriceAggregator from './price_aggregator.js';
import ApiFactory from './api_factory.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function main() {
    // Load all 'market_hash_name's from files/skins_not_grouped.json into an array
    const skinsFilePath = path.resolve(process.cwd(), 'files', 'skins_not_grouped.json');
    const skinsData = JSON.parse(fs.readFileSync(skinsFilePath, 'utf8'));
    const marketHashNames = skinsData.map(skin => skin.name);

    

    console.log("Starting price aggregation...");

    try {
        const aggregator = new PriceAggregator(marketHashNames);

        const csFloatApi = ApiFactory.createApi('csfloat', process.env.CS_FLOAT_API_KEY);
        aggregator.addApi(csFloatApi);

        console.log("Collecting and exporting data to JSON...");
        await aggregator.exportToJson("prices_output.json");

        console.log("Price aggregation finished successfully.");

    } catch (error) {
        console.error("An error occurred during the price aggregation process:", error);
    }
}

main();