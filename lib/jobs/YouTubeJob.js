const { google } = require('googleapis');
const Bobase = require('../Bobase');

class YouTubeJobTask extends Bobase {
  constructor(db) {
    super('youtube');
    this.db = db;
    this.yt = google.youtube({
      version: 'v3',
      auth: this.config.youtube.api_key,
    });
    this.params = {
      part: 'snippet',
      playlistId: this.config.youtube.playlist_id,
      maxResults: 50,
      headers: {},
    };
  }

  async insertVideo(video) {
    this.debug('Insert YTVideo');
    try {
      const res = await this.db.insertOne('ytvideos', video);
      this.log.info(`Insert successful (ID: ${res.insertedId})`);
      this.rc.publish('youtube', video.snippet.resourceId.videoId);
    } catch (err) {
      if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
        this.log.error(err);
      } else {
        this.debug(`${video.snippet.title} already exists`);
      }
    }
  }

  async processData(data) {
    this.debug(data);
    data.items.forEach(this.insertVideo.bind(this));
  }

  async run() {
    const res = await this.yt.playlistItems.list(this.params);
    switch (res.status) {
      case 200:
        if (res.data.etag !== undefined) {
          this.params.headers['If-None-Match'] = res.data.etag;
        }
        this.log.verbose(`${res.data.items.length} Videos received`);
        this.processData(res.data);
        break;
      case 304:
        this.log.verbose(`${res.statusText} (${res.status})`);
        break;
      default:
        this.log.warn(`${res.statusText} (${res.status})`);
        break;
    }
  }
}

module.exports = YouTubeJobTask;
