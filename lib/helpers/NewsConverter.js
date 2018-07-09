const mongodb = require('mongodb');
const { RichEmbed } = require('discord.js');
const Bobase = require('../Bobase');

class NewsConverter extends Bobase {
  constructor(db) {
    super('news');
    this.db = db;
    this.news = null;
    this.colors = {
      notice: 0x9c00ff,
      event: 0xff127c,
      dev: 0x00b756,
      patch: 0xbc843c,
    };
  }

  async fetch(id) {
    this.debug(`Fetching ${id} ... `);
    try {
      this.news = await this.db.db.collection('news').findOne({ _id: new mongodb.ObjectID(id) });
    } catch (err) {
      this.debug(err);
    }
  }

  toWebhook() {
    const me = new RichEmbed();
    me.setTitle(this.news.title);
    me.setURL(`https://www.blessonline.net${this.news.url}`);
    me.setDescription(this.news.text);
    me.setThumbnail(this.news.img);
    if (this.colors[this.news.mark] !== undefined) {
      me.setColor(this.colors[this.news.mark]);
      me.setAuthor(`${this.news.mark.toUpperCase()}`);
    }
    me.setTimestamp(this.news.date);
    me.setFooter('BlessOnline', 'http://www.blessonline.net/static/favicons/favicon-32x32.png');
    return me;
  }
}

module.exports = NewsConverter;
