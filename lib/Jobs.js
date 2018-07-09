const Agenda = require('agenda');
const Bobase = require('./Bobase');
const Database = require('./Database');
const BlessOnlineNetJob = require('./jobs/BlessOnlineNetJob');
const YouTubeJob = require('./jobs/YouTubeJob');
const SteamNewsJob = require('./jobs/SteamNewsJob');
const SteamItemsJob = require('./jobs/SteamItemsJob');
const ForumJob = require('./jobs/ForumJob');
const RedditJob = require('./jobs/RedditJob');
const GamepediaJob = require('./jobs/GamepediaJob');
const ServerStatusJob = require('./jobs/ServerStatusJob');
const PriceHistoryJob = require('./jobs/PriceHistoryJob');

class Jobs extends Bobase {
  constructor() {
    super('jobs');
    this.db = new Database(this.config.mongodb);
  }

  graceful() {
    this.log.warn('Graceful shutdown - Stopping Agenda');
    this.agenda.stop(() => {
      process.exit(0);
    });
  }

  async createAgenda() {
    await this.db.connect();
    this.newsJob = new BlessOnlineNetJob(this.db);
    this.ytJob = new YouTubeJob(this.db);
    this.snJob = new SteamNewsJob(this.db);
    this.forumJob = new ForumJob(this.db);
    this.redditJob = new RedditJob(this.db);
    this.wikiJob = new GamepediaJob(this.db);
    this.priceJob = new SteamItemsJob(this.db);
    this.statusJob = new ServerStatusJob(this.db);
    this.priceHistoryJob = new PriceHistoryJob(this.db);
    this.agenda = new Agenda({ mongo: this.db.db });
    process.on('SIGTERM', this.graceful.bind(this));
    process.on('SIGINT', this.graceful.bind(this));
    return this.agenda;
  }

  async defineJobs() {
    this.agenda.define('read news', async (job, done) => {
      this.debug('Job read news STARTED');
      try {
        await this.newsJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read news DONE');
    });
    this.agenda.define('read youtube', async (job, done) => {
      this.debug('Job read youtube STARTED');
      try {
        await this.ytJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read youtube DONE');
    });
    this.agenda.define('read steamnews', async (job, done) => {
      this.debug('Job read steamnews STARTED');
      try {
        await this.snJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read steamnews DONE');
    });
    this.agenda.define('read forum', async (job, done) => {
      this.debug('Job read forum STARTED');
      try {
        await this.forumJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read forum DONE');
    });
    this.agenda.define('read reddit', async (job, done) => {
      this.debug('Job read reddit STARTED');
      try {
        await this.redditJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read reddit DONE');
    });
    this.agenda.define('read wiki', async (job, done) => {
      this.debug('Job read wiki STARTED');
      try {
        await this.wikiJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read wiki DONE');
    });
    this.agenda.define('read prices', async (job, done) => {
      this.debug('Job read prices STARTED');
      try {
        await this.priceJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read prices DONE');
    });
    this.agenda.define('read serverstatus', async (job, done) => {
      this.debug('Job read serverstatus STARTED');
      try {
        await this.statusJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read serverstatus DONE');
    });
    this.agenda.define('read pricehistory', async (job, done) => {
      this.debug('Job read pricehistory STARTED');
      try {
        await this.priceHistoryJob.run();
      } catch (err) {
        job.fail(err);
      } finally {
        done();
      }
      this.debug('Job read pricehistory DONE');
    });
    return this.agenda;
  }
}

module.exports = Jobs;
