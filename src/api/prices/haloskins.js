import SkinPriceAPI from './skinprice.js';

import fs from 'fs';
import path from 'path';
import lockfile from 'proper-lockfile';
import chalk from 'chalk';

import { workerData } from 'worker_threads';

export default class HaloSkinsAPI extends SkinPriceAPI {
	constructor(apiKey = null) {
		super("HaloSkins", apiKey);
		this.rateLimit = false;
	}

	async getIndex() {
		const indexFilePath = path.resolve(process.cwd(), 'src/api/data/haloskins/haloskins_api_index.txt');
		return parseInt(fs.readFileSync(indexFilePath, 'utf8'));
	}

	async saveIndex(index) {
		const indexFilePath = path.resolve(process.cwd(), 'src/api/data/haloskins/haloskins_api_index.txt');
		fs.writeFileSync(indexFilePath, index.toString());
	}

	async fetchPrice(marketHashName) {
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
				this.rateLimit = true;
				console.error(chalk.red(`${this.prefix}: Rate limit hit when searching for: ${marketHashName}`));
				return null;
			}

			if (!data || !data.data || !data.data.list || data.data.list.length === 0 || !data.data.list[0].manualPrice || data.data.list[0].manualQuantity === 0) {
				console.warn(chalk.yellow(`${this.prefix}: No data found for ${marketHashName}`));
				return null;
			}

			console.log(chalk.green(`${this.prefix}: Found value for ${marketHashName}`));
			return {
				market_hash_name: marketHashName,
				price: data.data.list[0].manualPrice,
				source: 'HaloSkins'
			};

		} catch (error) {
			console.error(chalk.red(`${this.prefix}: Error fetching data for ${marketHashName}: ${error.message}`));
			return null;
		}

		return null;
	}

	formatData(data) {
		if (!data) {
			console.warn(chalk.yellow(`${this.prefix}: No data found`));
			return [];
		}
		return data;
	}
}

(async () => {
	const haloskinsApi = new HaloSkinsAPI(null);
	const marketHashNames = workerData;

	while (true) {
		let results = [];
		const index = await haloskinsApi.getIndex();
		for (let i = index; i < marketHashNames.length; i++) {
			if (i % 200 === 0 && i !== 0) {
				await haloskinsApi.writeToJson(results);
				await new Promise(resolve => setTimeout(resolve, 1000));
				results = [];
			}
			
			const marketHashName = marketHashNames[i];
			const data = await haloskinsApi.fetchPrice(marketHashName);

			if (haloskinsApi.rateLimit) {
				haloskinsApi.rateLimit = false;
				await haloskinsApi.saveIndex(i);

				if (results.length > 0) {
					await haloskinsApi.writeToJson(results);
				}

				// Wait for rate limit
				console.warn(chalk.red(`${haloskinsApi.prefix}: Rate limit hit, waiting for 30 minutes`));
				await new Promise(resolve => setTimeout(resolve, 1800000));
			}

			if (!data) {
				continue;
			}

			results.push(data);
		}
		await haloskinsApi.writeToJson(results);
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
})();