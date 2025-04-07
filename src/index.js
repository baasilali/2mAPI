import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Worker } from 'node:worker_threads';

dotenv.config();

async function main() {
    const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
    const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

    const csFloatIndexFilePath = path.resolve(process.cwd(), 'src', 'api', 'data', 'csfloat', 'csfloat_api_index.txt');
    if (!fs.existsSync(csFloatIndexFilePath)) {
        fs.writeFileSync(csFloatIndexFilePath, '0');
    }

    console.log("Starting price aggregation...");

    try {
        // const aggregator = new PriceAggregator(marketHashNames);

        // const csFloatApi = ApiFactory.createApi('csfloat', process.env.CS_FLOAT_API_KEY);
        // aggregator.addApi(csFloatApi);

        // const skinPortApi = ApiFactory.createApi('skinport', process.env.SKIN_PORT_API_KEY);
        // aggregator.addApi(skinPortApi);

        // const dmarketApi = ApiFactory.createApi('dmarket', null);
        // aggregator.addApi(dmarketApi);

        // const buff163Api = ApiFactory.createApi('buff163', null);
        // aggregator.addApi(buff163Api);

        // const haloSkinsApi = ApiFactory.createApi('haloskins', null);
        // aggregator.addApi(haloSkinsApi);

        // const steamApi = ApiFactory.createApi('steam', null);
        // aggregator.addApi(steamApi);

        // console.log("Collecting and exporting data to JSON...");
        // await aggregator.exportToJson();

        // console.log("Price aggregation finished successfully.");

        const workers = ["dmarket"];
        for(const worker of workers) {
            const workerThread = new Worker(path.resolve(process.cwd(), 'src/api/prices/', `${worker}.js`), {
                workerData: marketHashNames
            });

            workerThread.on('error', console.error);
            workerThread.on('exit', code => {                
                if (code !== 0) console.log(`Worker '${worker}' exited with code ${code}`);
            });
        }

    } catch (error) {
        console.error("An error occurred during the price aggregation process:", error);
    }
}

main();