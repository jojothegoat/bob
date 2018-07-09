const { MongoClient } = require('mongodb');
const debug = require('debug')('bob:pricehistory');
const rp = require('request-promise-native');
require('request-debug')(rp);
const moment = require('moment');

if (!debug.enabled) rp.stopDebugging();

const Bobase = require('../Bobase');

class PriceHistoryTask extends Bobase {
  constructor(db) {
    super('pricehistory');
    this.db = db;
  }

  async doit(BlessDB) {
    const dayStart = moment.utc().startOf('day');
    const ids = await this.db.db.collection('PriceHistory').distinct('item_cid', { created_at: { $gt: dayStart.toDate() } });
    const result = await BlessDB.collection('ItemInfo').find({ 'bl:grade': { $ne: 'poor' }, 'bl:bondingType': { $ne: 'OnGet' } }, { 'bl:item_id': 1 }).toArray();
    this.log.info(`${result.length} Items`);

    for (const item of result) {
      if (!ids.includes(String(item['bl:item_id']))) {
        this.log.verbose(`Get ${item['bl:item_id']}`);
        const url = `http://wic-ff-lb.blessonline.net/bless/exchange/index.php?ctrl=action&action_type=getPriceHistory&lang=ENG&item_id=${item['bl:item_id']}&item_evolution_level=0&item_upgrade_level=0`;
        const json = await rp.get(url, { json: true });
        const price = JSON.parse(json.trim(), (key, value) => ((Number.isNaN(parseFloat(value)) || key === 'item_cid') ? value : parseFloat(value)));
        price.created_at = new Date();
        if (price.item_cid === undefined) {
          price.item_cid = String(item['bl:item_id']);
        }
        this.db.db.collection('PriceHistory').insert(price);
      }
    }
  }

  async run() {
    const client = await MongoClient.connect('mongodb://localhost:27017');
    const BlessDB = await client.db('BlessData');
    await this.doit(BlessDB);
    client.close();
  }
}

module.exports = PriceHistoryTask;
