'use strict';

const SteamUser = require('steam-user');
const Bobase = require('./lib/Bobase');
const Database = require('./lib/Database');

class SteamApp extends Bobase {
  constructor() {
    super('steamapp');
    this.db = new Database(this.config.mongodb);
    this.appid = this.config.steam.appid;
    this.client = new SteamUser(null, { enablePicsCache: true, changelistUpdateInterval: 1000 });
    this.setupListener();
  }

  async insertApp(data) {
    this.debug('Insert App');
    try {
      const res = await this.db.insertOne('steamapp', data);
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('steamapp', res.insertedId.toString());
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`Changenumber ${data.changenumber} already exists`);
      }
    }
  }

  setupListener() {
    this.client.on('loggedOn', () => {
      this.log.info('Logged On');
      this.client.getProductInfo([this.appid], [], (apps) => {
        this.insertApp(apps[this.appid]);
      });
    });

    this.client.on('changelist', (changenumber) => {
      this.log.verbose('Changelist', changenumber);
    });

    this.client.on('appUpdate', (appid, data) => {
      this.log.verbose('AppUpdate', appid);
      if (appid === this.appid) {
        this.insertApp(data);
      }
    });
  }

  async start() {
    this.debug('Connecting to MongoDB ...');
    await this.db.connect();
    this.debug('Connecting to Steam ...');
    this.client.logOn();
  }
}

const steam = new SteamApp();
steam.start();
