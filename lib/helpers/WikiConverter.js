const mongodb = require('mongodb');
const { RichEmbed } = require('discord.js');
const Bobase = require('../Bobase');

class WikiConverter extends Bobase {
  constructor(db) {
    super('gamepedia');
    this.db = db;
    this.change = null;
  }

  async fetch(id) {
    this.debug(`Fetching ${id} ... `);
    try {
      this.change = await this.db.db.collection('gamepedia').findOne({ _id: new mongodb.ObjectID(id) });
    } catch (err) {
      this.debug(err);
    }
  }

  toWebhook() {
    const me = new RichEmbed();
    me.setAuthor(this.change.user, '', `https://blessonline.gamepedia.com/User%3A${encodeURI(this.change.user)}`);
    me.setTitle(this.change.title);
    me.setURL(`https://blessonline.gamepedia.com/${encodeURI(this.change.title)}`);
    const edit = `https://blessonline.gamepedia.com/index.php?title=${encodeURI(this.change.title)}&curid=${this.change.pageid}`;
    let desc = this.change.comment;
    switch (this.change.type) {
      case 'edit':
        desc += ` ([diff](${edit}&diff=${this.change.revid}&oldid=${this.change.old_revid}) | [hist](${edit}&action=history))`;
        break;
      case 'log':
        desc += ' ([log](https://blessonline.gamepedia.com/Special:Log))';
        break;
      case 'new':
        desc += ` ([diff](${edit}&diff=${this.change.revid}) | [hist](${edit}&action=history))`;
        break;
      default:
    }
    me.setDescription(desc);
    me.setTimestamp(new Date(this.change.timestamp));
    const diff = this.change.newlen - this.change.oldlen;
    me.setFooter(`${this.change.type} (0)`);
    me.setColor(0xa2a9b1);
    if (diff > 0) {
      me.setFooter(`${this.change.type} (+${diff})`);
      me.setColor(0x006400);
    } else if (diff < 0) {
      me.setFooter(`${this.change.type} (${diff})`);
      me.setColor(0x8b0000);
    }
    return me;
  }
}

module.exports = WikiConverter;
