const mongodb = require('mongodb');
const { RichEmbed } = require('discord.js');
const Bobase = require('../Bobase');

class PostConverter extends Bobase {
  constructor(db) {
    super('post');
    this.db = db;
    this.post = null;
  }

  async fetch(id) {
    this.debug(`Fetching ${id} ... `);
    try {
      this.post = await this.db.db.collection('posts').findOne({ _id: new mongodb.ObjectID(id) });
    } catch (err) {
      this.debug(err);
    }
  }

  toWebhook() {
    const me = new RichEmbed();
    let txt = this.post.text;
    me.setTitle(this.post.topicText);
    me.setURL(this.post.postLink);
    if (txt.length > 1999) {
      txt = `${txt.substring(0, 1995)}...`;
    }
    me.setDescription(txt);
    me.setAuthor(this.post.author.name, this.post.author.avatar, this.post.author.link);
    me.setTimestamp(this.post.timestamp);
    me.setFooter(this.post.forumname);
    return me;
  }
}

module.exports = PostConverter;
