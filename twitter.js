'use strict';

const Twit = require('twit');
const Bobase = require('./lib/Bobase');

class Twitter extends Bobase {
  constructor() {
    super('twitter');
    this.follow = this.config.twitter.follow;
    this.T = new Twit(this.config.twitter.api);
  }

  start() {
    this.stream = this.T.stream('statuses/filter', {
      follow: this.follow,
    });
    this.stream.on('error', (error) => {
      this.log.error(error);
    });
    this.stream.on('disconnect', (disconnectMessage) => {
      this.log.warn(disconnectMessage);
    });
    this.stream.on('connect', (r) => {
      this.debug(r);
      this.log.info('Connecting...');
    });
    this.stream.on('connected', (r) => {
      this.debug(r);
      this.log.info('Connected!');
    });
    this.stream.on('reconnect', (r) => {
      this.debug(r);
      this.log.info('Re-Connecting...');
    });
    this.stream.on('warning', (warning) => {
      this.log.warn(warning);
    });
    this.stream.on('tweet', (tweet) => {
      if (this.follow.includes(tweet.user.id_str)) {
        this.rc.publish('twitter', JSON.stringify(tweet));
      }
    });
  }

  stop() {
    this.stream.stop();
  }
}

const twitter = new Twitter();
twitter.start();
