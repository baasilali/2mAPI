import PriceAggregator from './price_aggregator.js';
import ApiFactory from './api_factory.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    console.log("Starting price aggregation...");

    try {
        const aggregator = new PriceAggregator();

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