import axios from 'axios';
import dotenv from 'dotenv';

import { load } from 'cheerio';

dotenv.config();

async function scrapePrice(url) {
  try {
      const response = await axios.get(url, {
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'cfz_google-analytics_v4=%7B%22lTnF_engagementDuration%22%3A%7B%22v%22%3A%220%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF_engagementStart%22%3A%7B%22v%22%3A%221744951761964%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF_counter%22%3A%7B%22v%22%3A%22289%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF_session_counter%22%3A%7B%22v%22%3A%2211%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF_ga4%22%3A%7B%22v%22%3A%22f9e80f99-4b48-4641-907f-a8de909341d6%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF__z_ga_audiences%22%3A%7B%22v%22%3A%22f9e80f99-4b48-4641-907f-a8de909341d6%22%2C%22e%22%3A1775852858300%7D%2C%22lTnF_let%22%3A%7B%22v%22%3A%221744951761964%22%2C%22e%22%3A1776487761964%7D%2C%22lTnF_ga4sid%22%3A%7B%22v%22%3A%22444460290%22%2C%22e%22%3A1744953561964%7D%7D; cfzs_google-analytics_v4=%7B%22lTnF_pageviewCounter%22%3A%7B%22v%22%3A%2270%22%7D%7D; _ga=GA1.1.210935154.1744441310; _ga_5YMSVJKHTZ=GS1.1.1744951578.8.1.1744951759.60.0.0; cf_clearance=ieeklvwrVTA1S8mboQ8sqpZilXpJ7DpbL_OPahmH59A-1744951577-1.2.1.1-fCsmZwfEeHzmWvzhxha79ccCazjBCrnDe1Af48kIhmgWbgU9bzZwKrJPLy6_aop.Eqf20idR0YBf8vkUGg_0_b05bCsUAJPGSaGfZyYfv378JGbJG0xNYCjch3nBg4poH8ygW17yDxwghcQ2cVo6Xa0QQgxzUocMyOS3AzK2c8JsvR.FAiahggmtkkBlWSICl5YjqExMfB3X3RisQ_pXtLNRCfcufiEx6acJ9R5fY1Qj1BVIDQG4g_LOEQKjqXyUFWiM0NJE2P_W7EnSDs9kfzmXy5HefV_AKKNj9XD0AWJeGBMNFBq1Y3lftpdnod6GLLVpiJUP4_0LWYS9AwTC9Vh5ckKMTyFpMiK.CJjC3JU; selected-chart-days=90; selected-chart-providers=%5B%22buff163%22%2C%22csmoney%22%2C%22skinbaron%22%2C%22tradeit%22%2C%22buffmarket%22%5D; hideGambling=true; marketStats=false; cs2_skin_view_type=boxes; items-grouped=true; i18n_redirected=en; pricempire-theme=slate',
          'Origin': 'https://pricempire.com',
          'Priority': 'u=3, i',
          'Referer': 'https://pricempire.com/cs2-items/tournament-team-sticker-capsule/ems-katowice-2014',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Safari/605.1.15',
          'Connection': 'keep-alive'
        }
      });
      const html = response.data;

      const $ = load(html);

      const items = [];

      $('div[name="list"] article').each((i, el) => {
        const name = $(el).find('.relative .flex .flex .flex .flex .flex .font-bold').text();
        const [store, price] = name.split('$');
        items.push({ store, price });
      });

      console.log(items);


  } catch (error) {
      console.error('Error fetching the page:', error);
  }
}

async function main() {
  scrapePrice("https://pricempire.com/cs2-items/skin/talon-knife-doppler-phase-1");
}

main();