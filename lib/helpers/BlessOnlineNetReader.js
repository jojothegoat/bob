const debug = require('debug')('bob:newsreader');
const moment = require('moment-timezone');
const rp = require('request-promise-native');
require('request-debug')(rp);
const cheerio = require('cheerio');

if (!debug.enabled) rp.stopDebugging();

class BlessOnlineNetReader {
  constructor(newsURL) {
    this.data = [];
    this.dom = null;
    this.newsURL = newsURL;
  }

  serializeNews(i, news) {
    const article = this.dom(news).children('article');
    const content = article.children('.n_cnt');
    const header = content.children('header');

    return {
      url: this.dom(news).attr('href'),
      img: article.find('.n_img > img[src]').first().attr('src'),
      mark: header.children('.n_mark').text(),
      title: header.children('.n_tit').text().trim(),
      date: moment.tz(header.children('.date').text(), 'D MMM, YYYY h:m A', 'Asia/Seoul').toDate(),
      text: content.children('.n_txt').text().trim(),
    };
  }

  async fetch() {
    debug(`Crawling ${this.newsURL} ...`);
    const html = await rp.get(this.newsURL, { resolveWithFullResponse: true });
    debug(`StatusCode: ${html.statusCode}`);
    if (html.headers.age !== undefined) {
      debug(`Age: ${html.headers.age}`);
    }
    debug(`Received ${html.body.length} characters`);
    this.dom = cheerio.load(html.body, { xmlMode: true });
    debug('DOM loaded');
    const newsContents = this.dom('li > a[href]');
    debug(`Found ${newsContents.length} news`);
    this.data = newsContents.map(this.serializeNews.bind(this)).get();
  }

  getAll() {
    return this.data;
  }

  getLatest() {
    return this.data[0];
  }
}

module.exports = BlessOnlineNetReader;
