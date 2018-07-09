const debug = require('debug')('bob:gamepedia');
const MWBot = require('nodemw');
const Bobase = require('../Bobase');

class GamepediaTask extends Bobase {
  constructor(db) {
    super('gamepedia');
    this.db = db;
    if (debug.enabled) this.config.gamepedia.debug = true;
    this.client = new MWBot(this.config.gamepedia);
    this.login();
    this.rcend = '';
  }

  async recentchanges() {
    const props = ['comment', 'ids', 'sizes', 'timestamp', 'title', 'user'];
    return new Promise((resolve, reject) => {
      const options = {
        action: 'query',
        list: 'recentchanges',
        rcnamespace: 0,
        rcprop: props.join('|'),
        rclimit: 500,
      };
      if (this.rcend.length > 0) options.rcend = this.rcend;
      this.client.api.call(options, (err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    });
  }

  async login() {
    return new Promise((resolve, reject) => {
      this.client.logIn((err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async insertChange(change) {
    try {
      const res = await this.db.insertOne('gamepedia', change);
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('gamepedia', res.insertedId.toString());
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`Change ${change.rcid} already exists`);
      }
    }
  }

  async processChange(change) {
    const ts = new Date(change.timestamp);
    const end = new Date(this.rcend);
    if (this.rcend === '' || ts > end) {
      this.rcend = change.timestamp;
    }
    this.insertChange(change);
  }

  async run() {
    const changes = await this.recentchanges();
    this.log.verbose(`${changes.recentchanges.length} recent changes received.`);
    changes.recentchanges.forEach(this.processChange.bind(this));
  }
}

module.exports = GamepediaTask;
