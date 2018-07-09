'use strict';

const Database = require('./lib/Database');
const NewsConverter = require('./lib/helpers/NewsConverter');
const PostConverter = require('./lib/helpers/PostConverter');
const SteamAppConverter = require('./lib/helpers/SteamAppConverter');
const WikiConverter = require('./lib/helpers/WikiConverter');
const WebHooks = require('./lib/helpers/WebHooks');
const Bobase = require('./lib/Bobase');
const Snoowrap = require('snoowrap');

class NewsReader extends Bobase {
  constructor() {
    super('webhooks');
    this.db = new Database(this.config.mongodb);
    this.pc = new PostConverter(this.db);
    this.nc = new NewsConverter(this.db);
    this.wc = new WikiConverter(this.db);
    this.wh = new WebHooks(this.db);
    this.sc = new SteamAppConverter(this.db);
  }

  async newsReceiver(id) {
    this.debug(`Find news with ID ${id} ...`);
    await this.nc.fetch(id);
    this.debug(this.nc.news);
    if (this.nc.news !== null) {
      this.debug('News found');
      await this.wh.getWebhooks('news');
      this.wh.sendToAll('news', '**Bless Online NEWS**', this.nc.toWebhook());
    } else {
      this.log.warn(`News ID ${id} not found`);
    }
  }

  async wikiReceiver(id) {
    this.debug(`Find change with ID ${id} ...`);
    await this.wc.fetch(id);
    this.debug(this.wc.change);
    if (this.wc.change !== null) {
      this.debug('Change found');
      await this.wh.getWebhooks('gamepedia');
      this.wh.sendToAll('gamepedia', '**Gamepedia Change**', this.wc.toWebhook());
    } else {
      this.log.warn(`Change ID ${id} not found`);
    }
  }


  async steamappReceiver(id) {
    this.debug(`Find AppUpdate with ID ${id} ...`);
    await this.sc.fetch(id);
    this.debug(this.sc.appUpdate);
    if (this.sc.appUpdate !== null) {
      this.debug('AppUpdate found');
      if (await this.sc.noTagsChanged()) {
        await this.wh.getWebhooks('tracker');
        this.wh.sendToAll('tracker', '**App changed**', this.sc.toWebhook());
      }
      if (await this.sc.hasBuildChanged()) {
        await this.wh.getWebhooks('steamapp');
        this.wh.sendToAll('steamapp', '**Steam Update**', this.sc.toPatchWebhook());
      }
    } else {
      this.log.warn(`AppUpdate ID ${id} not found`);
    }
  }

  async postReceiver(id) {
    this.debug(`Find post with ID ${id} ...`);
    await this.pc.fetch(id);
    this.debug(this.pc.post);
    if (this.pc.post !== null) {
      this.debug('Post found');
      await this.wh.getWebhooks('tracker');
      this.wh.sendToAll('tracker', '', this.pc.toWebhook());
    } else {
      this.log.warn(`Post ID ${id} not found`);
    }
  }

  async steamnewsReceiver(link) {
    await this.wh.getWebhooks('steamnews');
    const msg = `**Community Announcement**\n${link}`;
    this.wh.sendToAll('steamnews', msg);
  }

  async ytReceiver(link) {
    await this.wh.getWebhooks('youtube');
    const url = `https://youtu.be/${link}`;
    const msg = `**Bless Online just uploaded a video**\n${url}`;
    this.wh.sendToAll('youtube', msg);
  }

  async statusReceiver(state) {
    await this.wh.getWebhooks('serverstatus');
    const status = state.serverOpen ? 'ONLINE' : 'OFFLINE';
    const msg = `Serverstatus of **${state.serverName}** changed to **${status}**!`;
    this.wh.sendToAll('serverstatus', msg);
  }

  async tweetReceiver(tweet) {
    const twitlink = `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;
    this.log.info(`${tweet.user.screen_name}: ${tweet.text} (${twitlink})`);
    if (tweet.in_reply_to_user_id === null && tweet.retweeted_status === undefined) {
      await this.wh.getWebhooks('twitter');
      this.wh.sendToAll('twitter', twitlink);
    } else {
      await this.wh.getWebhooks('tracker');
      this.wh.sendToAll('tracker', twitlink);
    }
  }

  async redditReceiver(submission) {
    const link = `https://www.reddit.com/r/${submission.subreddit}/comments/${submission.id}/`;
    this.log.info(link);
    await this.wh.getWebhooks('reddit');
    this.wh.sendToAll('reddit', link);
  }

  setListeners() {
    this.rc.on('subscribe', (ch, count) => {
      this.log.info(`Subscribed to ${ch} (Count: ${count})`);
    });

    this.rc.on('message', (ch, msg) => {
      this.log.info(`${ch}: ${msg}`);
      switch (ch) {
        case 'news': {
          this.newsReceiver(msg);
          break;
        }
        case 'steamnews': {
          this.steamnewsReceiver(msg);
          break;
        }
        case 'youtube': {
          this.ytReceiver(msg);
          break;
        }
        case 'twitter': {
          this.tweetReceiver(JSON.parse(msg));
          break;
        }
        case 'forum': {
          this.postReceiver(msg);
          break;
        }
        case 'steamapp': {
          this.steamappReceiver(msg);
          break;
        }
        case 'reddit': {
          this.redditReceiver(JSON.parse(msg));
          break;
        }
        case 'gamepedia': {
          this.wikiReceiver(msg);
          break;
        }
        case 'serverstatus': {
          this.statusReceiver(JSON.parse(msg));
          break;
        }
        default:
          this.log.warn(`Unknown Channel ${ch}`);
      }
    });
  }

  async start() {
    await this.db.connect();
    this.debug('Subscribing ...');
    this.rc.subscribe('news', 'steamnews', 'youtube', 'twitter', 'forum', 'steamapp', 'reddit', 'gamepedia', 'serverstatus');
    this.setListeners();
  }
}

const newsReader = new NewsReader();
newsReader.start();
