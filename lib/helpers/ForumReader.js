const debug = require('debug')('bob:newsreader');
const rp = require('request-promise-native');
require('request-debug')(rp);
const cheerio = require('cheerio');

if (!debug.enabled) rp.stopDebugging();

class BlessOnlineNetReader {
  constructor() {
    this.data = [];
    this.dom = null;
  }

  serializeSearchResult(i, searchResult) {
    const dom = this.dom(searchResult);
    const forum = dom.find('div.searchresult_forumname > a.searchresult_forum_link[href]').first();
    const inreplyto = dom.children('div.searchresult_inreplyto');
    const post = dom.find('div.searchresult_matches > div.post_searchresult_simplereply[onclick]').first();
    const topicLink = inreplyto.children('a.forum_topic_link[href]');

    let link = post.attr('onclick');
    const matches = link.match(/^window\.location='(.*)'$/);
    if (matches.length > 1) {
      [, link] = matches;
    }
    return {
      forumname: forum.text(),
      forumLink: forum.attr('href'),
      timestamp: new Date(inreplyto.children('div.searchresult_timestamp[data-timestamp]').attr('data-timestamp') * 1000),
      topicLink: topicLink.attr('href'),
      topicText: topicLink.text(),
      postLink: link,
      text: post.text(),
      author: this.author,
    };
  }

  async getAuthor(profile) {
    const dom = this.dom(profile);
    const name = dom.find('div.profile_small_header_text > span.profile_small_header_name > a[href]').first();
    const avatar = dom.find('a[href] > div.profile_small_header_avatar > div.playerAvatar > img[src]').first();
    return {
      name: name.text(),
      link: name.attr('href'),
      avatar: avatar.attr('src'),
    };
  }

  async fetch(url) {
    debug(`Crawling ${url} ...`);
    const html = await rp.get(url, { resolveWithFullResponse: true });
    debug(`StatusCode: ${html.statusCode}`);
    debug(`Received ${html.body.length} characters`);
    this.dom = cheerio.load(html.body);
    debug('DOM loaded');
    const searchResult = this.dom('div.post_searchresult');
    debug(`Found ${searchResult.length} news`);
    this.author = await this.getAuthor(this.dom('div.profile_small_header_texture'));
    this.data = searchResult.map(this.serializeSearchResult.bind(this)).get();
  }

  getAll() {
    return this.data;
  }

  getLatest() {
    return this.data[0];
  }
}

module.exports = BlessOnlineNetReader;
