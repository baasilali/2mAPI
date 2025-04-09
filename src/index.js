import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Worker } from 'node:worker_threads';

dotenv.config();

async function main() {
  const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
  const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

  try {
    const workers = ["buff163", "csfloat", "dmarket", "haloskins", "skinport", "steam"];
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