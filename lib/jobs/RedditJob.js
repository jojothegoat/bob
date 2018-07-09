const Snoowrap = require('snoowrap');
const Bobase = require('../Bobase');

class RedditTask extends Bobase {
  constructor(db) {
    super('reddit');
    this.db = db;
    const { options } = this.config.reddit;
    options.userAgent = `${process.title}:bobot:${process.version} (by /u/${options.username})`;
    this.debug(`UserAgent: ${options.userAgent}`);
    this.r = new Snoowrap(options);
  }

  async insertSubmission(submission) {
    try {
      const res = await this.db.insertOne('reddit', {
        name: submission.name,
        created_utc: submission.created_utc,
      });
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('reddit', JSON.stringify(submission));
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`Submission ${submission.name} already exists`);
      }
    }
  }

  async processSubmission(submission) {
    this.debug(`${submission.name}: https://www.reddit.com/r/${this.config.reddit.subreddit}/comments/${submission.name}/`);
    this.insertSubmission(submission);
  }

  async run() {
    const submissions = await this.r.getSubreddit(this.config.reddit.subreddit).getNew();
    this.log.verbose(`${submissions.length} Submissions received`);
    submissions.forEach(this.processSubmission.bind(this));
  }
}

module.exports = RedditTask;
