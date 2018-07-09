const debug = require('debug')('bob:steamnews');
const rp = require('request-promise-native');
require('request-debug')(rp);
const Bobase = require('../Bobase');

if (!debug.enabled) rp.stopDebugging();

class SteamItemsTask extends Bobase {
  constructor(db) {
    super('steamitems');
    this.db = db;
    this.URL = 'http://api.steampowered.com/ISteamEconomy/GetAssetPrices/v1/';
    this.URL += `?appid=${this.config.steam.appid}&format=json&key=${this.config.steam.key}`;
  }

  async getPrices() {
    this.debug('Get Prices');
    let json = null;
    json = await rp.get(`${this.URL}&t=${Date.now()}`).catch((err) => {
      this.log.warn(err.message);
    });
    return JSON.parse(json);
  }

  async processPrices(prices) {
    this.debug('Insert Prices');
    await this.db.db.collection('steamitems').deleteMany({});
    await this.db.db.collection('steamitems').insertMany(prices);
  }

  async run() {
    const res = await this.getPrices();
    if (res !== null) {
      this.log.verbose(`Received ${res.result.assets.length} Assets`);
      if (res.result.assets.length > 0) {
        this.processPrices(res.result.assets);
      }
    }
  }
}

module.exports = SteamItemsTask;
