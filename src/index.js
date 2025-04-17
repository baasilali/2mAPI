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
          'Cookie': '_ga=GA1.1.210935154.1744421310; _ga_5YMSVJKHTZ=GS1.1.1744597691.6.0.1744597691.60.0.0; cfz_google-analytics_v4=%7B%22lTnF_engagementDuration%22%3A%7B%22v%22%3A%220%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF_engagementStart%22%3A%7B%22v%22%3A%221744597691927%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF_counter%22%3A%7B%22v%22%3A%22240%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF_session_counter%22%3A%7B%22v%22%3A%228%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF_ga4%22%3A%7B%22v%22%3A%22f9e80f99-4b48-4641-907f-a8de909341d6%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF__z_ga_audiences%22%3A%7B%22v%22%3A%22f9e80f99-4b48-4641-907f-a8de909341d6%22%2C%22e%22%3A1775852858300%7D%2C%22lTnF_let%22%3A%7B%22v%22%3A%221744597691927%22%2C%22e%22%3A1776133691927%7D%2C%22lTnF_ga4sid%22%3A%7B%22v%22%3A%222098425105%22%2C%22e%22%3A1744599491927%7D%7D; cfzs_google-analytics_v4=%7B%22lTnF_pageviewCounter%22%3A%7B%22v%22%3A%2242%22%7D%7D; cf_clearance=gT8xBsZ4jpKiKgRg58xXCo2OPXQlXs5N6Nr43udd8fw-1744597691-1.2.1.1-gy7nNasp_E37hvV5oV3f80m1dghuGlOHMrSwxg4hFmIx5msUnLCZB7LoFj7tQqWB1SF.3ap6NbNdX_eC4kN_supJCdIEgwajgttj8fF_nX7nmFTv8RspYXnmxt.e1xS1Up8q4hrTwKy02uUTpT_u0Hzl2Ee3V5I_9nA07Id3dB9wxX2OC7c3kmHHVf5y_cM_aiTI8J6N.NlEM0zLSMa5Wqf0hZj361plwyzJQX4seTU68VQeuZOnLZnsAJC8gXCgHSg8PcZmBm3mgZCBPdCmWQBGg7soxsdzkxxGz17TKIPeW.Vmgt8.pZmVuvNNl3jVk7kTcmS9_qU36zMyCWkBKU2QlWBOBcp7fGWA3dDUjFvsCvSOSNgpXphKXpGCn97G; selected-chart-days=90; selected-chart-providers=%5B%22buff163%22%2C%22csmoney%22%2C%22skinbaron%22%2C%22tradeit%22%2C%22buffmarket%22%5D; hideGambling=true; marketStats=false; cs2_skin_view_type=boxes; items-grouped=true; i18n_redirected=en; pricempire-theme=slate',
          'Origin': 'https://pricempire.com',
          'Priority': 'u=3, i',
          'Referer': 'https://pricempire.com/cs2-items/skin/ak-47-case-hardened/factory-new',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0.1 Safari/605.1.15'
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