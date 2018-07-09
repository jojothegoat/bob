const debug = require('debug');
const winston = require('winston');
const redis = require('redis');
require('winston-mongodb');
const config = require('../config.json');

winston.handleExceptions([new winston.transports.Console({
  timestamp: true,
  colorize: true,
}), new winston.transports.File({ filename: './logs/exceptions.log' })]);

class Bobase {
  constructor(name) {
    this.config = config;
    this.createLogger(`bob:${name}`);
    this.debug = debug(`bob:${name}`);
    this.debug(`Bobase ${name} created`);
    this.rc = redis.createClient();
  }

  createLogger(name) {
    this.log = new (winston.Logger)({
      transports: [
        new winston.transports.Console({
          level: 'verbose',
          timestamp: true,
          colorize: true,
          label: name,
        }),
        new winston.transports.MongoDB({
          db: config.mongodb.uri,
          level: 'info',
          capped: true,
          label: name,
        }),
        new winston.transports.File({
          filename: './logs/errors.log',
          level: 'error',
          timestamp: true,
          label: name,
        }),
      ],
    });
  }
}

module.exports = Bobase;
