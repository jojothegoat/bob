const debug = require('debug')('bob:steamnews');
const rp = require('request-promise-native');
require('request-debug')(rp);
const Bobase = require('../Bobase');

if (!debug.enabled) rp.stopDebugging();

class SteamNewsTask extends Bobase {
  constructor(db) {
    super('steamnews');
    this.db = db;
    this.URL = 'http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/';
    this.URL += `?appid=${this.config.steam.appid}&count=1&format=json&key=${this.config.steam.key}`;
  }

  async getNews() {
    this.debug('Get News');
    let json = null;
    json = await rp.get(`${this.URL}&t=${Date.now()}`).catch((err) => {
      this.log.warn(err.message);
    });
    return JSON.parse(json);
  }

  async insertNews(news) {
    this.debug('Insert News');
    try {
      const res = await this.db.insertOne('steamnews', news);
      const link = `http://store.steampowered.com/news/externalpost/${news.feedname}/${news.gid}`;
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('steamnews', link);
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`${news.gid} already exists`);
      }
    }
  }

  async processNews(news) {
    this.debug('Check NewsDB');
    news.forEach(this.insertNews.bind(this));
  }

  async run() {
    const res = await this.getNews();
    if (res !== null) {
      this.log.verbose(`Received ${res.appnews.newsitems.length}/${res.appnews.count} News`);
      if (res.appnews.newsitems.length > 0) {
        this.processNews(res.appnews.newsitems);
      }
    }
  }
}

module.exports = SteamNewsTask;
