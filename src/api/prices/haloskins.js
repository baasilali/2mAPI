import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

export default class HaloSkinsAPI extends SkinPriceAPI {
  constructor(apiKey = null) {
    super("HaloSkins", apiKey);
  }

  async fetchPrices(marketHashNames) {
    const results = [];
    
    const exteriorMapping = {
        'Factory New': 'WearCategory0',
        'Minimal Wear': 'WearCategory1',
        'Field-Tested': 'WearCategory2',
        'Well-Worn': 'WearCategory3',
        'Battle-Scarred': 'WearCategory4'
    };
    
    const typeMapping = {
        'Kukri Knife': 'weapon_knife_kukri',
        'Flip Knife': 'weapon_knife_flip',
        'Bayonet': 'weapon_bayonet',
        'Karambit': 'weapon_knife_karambit',
        'Bowie Knife': 'weapon_knife_survival_bowie',
        'Talon Knife': 'weapon_knife_widowmaker',
        'Ursus Knife': 'weapon_knife_ursus',
        'Gut Knife': 'weapon_knife_gut',
        'M9 Bayonet': 'weapon_knife_m9_bayonet',
        'Falchion Knife': 'weapon_knife_falchion',
        'Butterfly Knife': 'weapon_knife_butterfly',
        'Shadow Daggers': 'weapon_knife_push',
        'Huntsman Knife': 'weapon_knife_tactical',
        'Stiletto Knife': 'weapon_knife_stiletto',
        'Navaja Knife': 'weapon_knife_gypsy_jackknife',
        'Survival Knife': 'weapon_knife_gypsy_jackknife',
        'Skeleton Knife': 'weapon_knife_skeleton',
        'Paracord Knife': 'weapon_knife_cord',
        'Nomad Knife': 'weapon_knife_outdoor',
        'Classic Knife': 'weapon_knife_css',
        'P2000': 'weapon_hkp2000',
        'Glock-18': 'weapon_glock',
        'Five-SeveN': 'weapon_fiveseven',
        'Tec-9': 'weapon_tec9',
        'Dual Berettas': 'weapon_elite',
        'USP-S': 'weapon_usp_silencer',
        'P250': 'weapon_p250',
        'CZ75-Auto': 'weapon_cz75a',
        'R8 Revolver': 'weapon_revolver',
        'Desert Eagle': 'weapon_deagle',
        'FAMAS': 'weapon_famas',
        'M4A4': 'weapon_m4a1',
        'AK-47': 'weapon_ak47',
        'SG 553': 'weapon_sg556',
        'SCAR-20': 'weapon_scar20',
        'G3SG1': 'weapon_g3sg1',
        'Galil AR': 'weapon_galilar',
        'M4A1-S': 'weapon_m4a1_silencer',
        'AUG': 'weapon_aug',
        'SSG 08': 'weapon_ssg08',
        'AWP': 'weapon_awp',
        'Nova': 'weapon_nova',
        'MAG-7': 'weapon_mag7',
        'XM1014': 'weapon_xm1014',
        'Sawed-Off': 'weapon_sawedoff',
        'MAC-10': 'weapon_mac10',
        'MP7': 'weapon_mp7',
        'PP-Bizon': 'weapon_bizon',
        'MP5-SD': 'weapon_mp5sd',
        'MP9': 'weapon_mp9',
        'UMP-45': 'weapon_ump45',
        'P90': 'weapon_p90',
        'M249': 'weapon_m249',
        'Negev': 'weapon_negev',
        'Bloodhound Gloves': 'Bloodhound Gloves',
        'Hand Wraps': 'Hand Wraps',
        'Specialist Gloves': 'Specialist Gloves',
        'Driver Gloves': 'Driver Gloves',
        'Moto Gloves': 'Moto Gloves',
        'Sport Gloves': 'Sport Gloves',
        'Hydra Gloves': 'Hydra Gloves',
        'Broken Fang Gloves': 'Broken Fang Gloves'
    };
    
    for (const marketHashName of marketHashNames) {
        try {
            let weaponType, skinName, exterior;
            
            if (marketHashName.includes('Gloves') || marketHashName.includes('Hand Wraps')) {
                const parts = marketHashName.split(' | ');
                weaponType = parts[0].replace('★ ', '');
                
                const skinAndExterior = parts[1].match(/(.+) \((.+)\)/);
                if (skinAndExterior) {
                    skinName = skinAndExterior[1];
                    exterior = skinAndExterior[2];
                }
            } else {
                const parts = marketHashName.split(' | ');
                weaponType = parts[0].replace('★ ', '').replace('Souvenir ', '');
                
                const skinAndExterior = parts[1].match(/(.+) \((.+)\)/);
                if (skinAndExterior) {
                    skinName = skinAndExterior[1];
                    exterior = skinAndExterior[2];
                }
            }
            
            let quality = "normal";
            if (marketHashName.startsWith("StatTrak™")) {
                quality = "strange";
            } else if (marketHashName.startsWith("Souvenir")) {
                quality = "tournament";
            }
            
            const body = {
                appId: 730,
                limit: 30,
                page: 1,
                keyword: skinName,
                sort: "1",
                quality: quality,
                exterior: exteriorMapping[exterior],
                type: typeMapping[weaponType]
            };
            
            const response = await fetch('https://api.haloskins.com/steam-trade-center/search/product/list?appId=730', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();

            // TODO: Save index in file
            if (data.code === 61117) {
                console.error(chalk.red(`${this.prefix}: Rate limit hit when searching for: ${marketHashName}`));
                break;
            }

            if(!data || !data.data) {
                console.warn(chalk.yellow(`${this.prefix}: No data found for ${marketHashName}`));
            } else {
                results.push({
                    market_hash_name: marketHashName,
                    price: data.data.list[0].manualPrice,
                    source: 'HaloSkins'
                });
                console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
            }

        } catch (error) {
            console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}: ${error.message}`));
        }
    }
    
    return results;
  }

  formatData(data) {
    if (!data) {
        console.warn(chalk.yellow(`${this.prefix}: No data found`));
        return [];
    }
    return data;
  }

  async writeToJson(data) {
    const filePath = path.resolve(process.cwd(), 'prices_output.json');
    
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}', 'utf8');
      }
      
      await lockfile.lock(filePath, { retries: 5, retryWait: 1000 });
      
      let existingData = {};
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        existingData = JSON.parse(fileContent);
      } catch (error) {
        console.error(`${this.prefix}: Error reading prices_output.json: ${error.message}`);
      }
      
      // Process data to create the proper structure
      for (const item of data) {
        if (!existingData[item.market_hash_name]) {
          existingData[item.market_hash_name] = {};
        }
        
        existingData[item.market_hash_name][this.apiName] = {
          price: item.price,
          ...Object.fromEntries(
            Object.entries(item).filter(([key]) => 
              !['market_hash_name', 'source'].includes(key) && key !== 'price'
            )
          )
        };
      }
      
      fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
      console.log(`${this.prefix}: Successfully wrote data to prices_output.json`);
    } catch (error) {
      console.error(`${this.prefix}: Error writing to prices_output.json: ${error.message}`);
    } finally {
      try {
        await lockfile.unlock(filePath);
      } catch (unlockError) {
        console.error(`${this.prefix}: Error unlocking file: ${unlockError.message}`);
      }
    }
  }
} 

(async () => {
  const haloskinsApi = new HaloSkinsAPI(null);

  const marketHashNamesFilePath = path.resolve(process.cwd(), 'data', 'market_hash_names.txt');
  const marketHashNames = fs.readFileSync(marketHashNamesFilePath, 'utf8').split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const data = await haloskinsApi.fetchPrices(marketHashNames);
  const formatted_data = haloskinsApi.formatData(data);

  await haloskinsApi.writeToJson(formatted_data);
})();