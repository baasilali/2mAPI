import PriceAggregator from './price_aggregator.js';
import ApiFactory from './api_factory.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

async function main() {
    const marketHashNamesFilePath = path.resolve(process.cwd(), 'files', 'market_hash_names.txt');
    const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log("Starting price aggregation...");

    try {
        const aggregator = new PriceAggregator(marketHashNames);

        const csFloatApi = ApiFactory.createApi('csfloat', process.env.CS_FLOAT_API_KEY);
        aggregator.addApi(csFloatApi);

        const skinPortApi = ApiFactory.createApi('skinport', process.env.SKIN_PORT_API_KEY);
        aggregator.addApi(skinPortApi);

        console.log("Collecting and exporting data to JSON...");
        await aggregator.exportToJson();

        console.log("Price aggregation finished successfully.");

    } catch (error) {
        console.error("An error occurred during the price aggregation process:", error);
    }
}

main();