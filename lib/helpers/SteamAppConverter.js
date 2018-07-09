const { RichEmbed } = require('discord.js');
const Bobase = require('../Bobase');
const { ObjectID } = require('mongodb');
const assert = require('assert');

class SteamAppConverter extends Bobase {
  constructor(db) {
    super('steamapp');
    this.db = db;
    this.appUpdate = null;
    this.changenumber = 0;
  }

  async fetch(id) {
    this.debug(`Fetching ${id} ... `);
    try {
      this.appUpdate = await this.db.db.collection('steamapp').findOne({
        _id: new ObjectID(id),
      });
      this.changenumber = this.appUpdate.changenumber;
    } catch (err) {
      this.debug(err);
    }
  }

  async getLastBuild() {
    const last = await this.db.db.collection('steamapp')
      .find({ _id: { $ne: ObjectID(this.appUpdate._id) } })
      .sort({ 'appinfo.depots.branches.public.buildid': -1 })
      .limit(1)
      .toArray();
    this.debug(last);
    return last;
  }

  async noTagsChanged() {
    const last = await this.db.db.collection('steamapp')
      .find({ _id: { $ne: ObjectID(this.appUpdate._id) } })
      .sort({ changenumber: -1 })
      .limit(1)
      .toArray();
    if (last.length === 0) return true;
    last[0].changenumber = null;
    last[0].appinfo.common.store_tags = null;
    this.appUpdate.changenumber = null;
    this.appUpdate.appinfo.common.store_tags = null;
    try {
      assert.deepStrictEqual(last[0], this.appUpdate);
    } catch (err) {
      return true;
    }
    return false;
  }

  async hasBuildChanged() {
    if (this.appUpdate.appinfo.depots === undefined
      || this.appUpdate.appinfo.depots.branches === undefined
      || this.appUpdate.appinfo.depots.branches.public === undefined) return false;
    const { buildid } = this.appUpdate.appinfo.depots.branches.public;
    this.log.info(`Current Build ID: ${buildid}`);
    const last = await this.getLastBuild();
    if (last.length === 0) return true;
    const lastBuildId = last[0].appinfo.depots.branches.public.buildid;
    this.log.info(`Last Build ID: ${lastBuildId}`);
    if (lastBuildId < buildid) return true;
    return false;
  }

  toWebhook() {
    const me = new RichEmbed();
    me.setColor(0x171a21);
    me.setDescription(`Change [#${this.changenumber}](https://steamdb.info/changelist/${this.changenumber}/)`);
    me.setTimestamp();
    me.setAuthor('SteamDB', '', `https://steamdb.info/app/${this.appUpdate.appinfo.appid}/history/`);
    return me;
  }

  toPatchWebhook() {
    const info = this.appUpdate.appinfo;
    const branch = info.depots.branches.public;
    const me = new RichEmbed();
    me.setColor(0x171a21);
    me.setAuthor(info.common.name, `https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/${info.appid}/${info.common.icon}.jpg`, `https://steamcommunity.com/app/${info.appid}`);
    me.setTitle(`⬆️ Build ID: ${branch.buildid}`);
    me.setDescription(`Open on Steam:\nsteam://nav/games/details/${info.appid}`);
    me.setThumbnail(`https://steamcdn-a.opskins.media/steamcommunity/public/images/apps/${info.appid}/${info.common.logo}.jpg`);
    me.setFooter(`Change #${this.changenumber}`);
    me.setTimestamp(new Date(branch.timeupdated * 1000));
    return me;
  }
}

module.exports = SteamAppConverter;
