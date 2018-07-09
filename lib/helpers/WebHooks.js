const { WebhookClient } = require('discord.js');
const Bobase = require('../Bobase');

class WebHooks extends Bobase {
  constructor(db) {
    super('webhooks');
    this.db = db;
    this.tags = [
      '',
      '',
      '@here ',
      '@everyone ',
    ];
  }

  async getWebhooks(tag) {
    this.debug(`Get Subscribers for ${tag}...`);
    this.collection = this.db.db.collection('webhook');
    const q = { deletedAt: { $exists: false } };
    q[`subs.${tag}`] = { $gt: 0 };
    this.webhooks = await this.collection.find(q).toArray();
    this.log.info(`${this.webhooks.length} ${tag} Subscribers`);
  }

  async sendToAll(tag, topic, message) {
    this.debug('Sending ...');
    this.webhooks.forEach(async (w) => {
      this.debug(`Send msg to ${w._id}`);
      try {
        const hook = new WebhookClient(w._id, w.token);
        await hook.send(this.tags[w.subs[tag]] + topic, message);
      } catch (err) {
        const data = {
          $inc: { errorCount: 1 },
          $set: { lastError: err, errorDate: new Date() },
        };
        if (err.code === 10015) {
          data.$set.deletedAt = new Date();
          this.log.info(`Webhook ${w._id} deleted.`);
        } else {
          this.log.error(err.code);
        }
        this.collection.updateOne(w, data);
      }
    });
  }
}

module.exports = WebHooks;
