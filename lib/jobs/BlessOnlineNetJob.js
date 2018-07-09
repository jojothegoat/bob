const BlessOnlineNetReader = require('../helpers/BlessOnlineNetReader');
const Bobase = require('../Bobase');

class BlessOnlineNetTask extends Bobase {
  constructor(db) {
    super('news');
    this.db = db;
    this.reader = new BlessOnlineNetReader(this.config.news_url);
  }

  async fetchAndGetNews() {
    this.debug('Fetch News');
    await this.reader.fetch();
    this.debug('Get News');
    return this.reader.getAll();
  }

  async insertNews(news) {
    this.debug('Insert News');
    try {
      const res = await this.db.insertOne('news', news);
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('news', res.insertedId.toString());
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`${news.url} already exists`);
      }
    }
  }

  async processNews(news) {
    this.debug('Check NewsDB');
    news.forEach(this.insertNews.bind(this));
  }

  async run() {
    const news = await this.fetchAndGetNews();
    this.log.verbose(`Received ${news.length} News`);
    this.processNews(news);
  }
}

module.exports = BlessOnlineNetTask;
