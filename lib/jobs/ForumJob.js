const ForumReader = require('../helpers/ForumReader');
const Bobase = require('../Bobase');

class ForumTask extends Bobase {
  constructor(db) {
    super('forum');
    this.db = db;
    this.URLs = this.config.forum_urls;
    this.reader = new ForumReader();
  }

  async fetchAndGetPosts(url) {
    this.debug('Fetch Posts');
    await this.reader.fetch(url);
    this.debug('Get Posts');
    return this.reader.getAll();
  }

  async insertPost(post) {
    this.debug('Insert Post');
    try {
      const res = await this.db.insertOne('posts', post);
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('forum', res.insertedId.toString());
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`${post.postLink} already exists`);
      }
    }
  }

  async processPosts(posts) {
    this.debug('Check NewsDB');
    posts.forEach(this.insertPost.bind(this));
  }

  async run() {
    this.URLs.forEach(async (url) => {
      const posts = await this.fetchAndGetPosts(url);
      this.log.verbose(`Received ${posts.length} Posts`);
      this.debug(posts);
      this.processPosts(posts);
    });
  }
}

module.exports = ForumTask;
