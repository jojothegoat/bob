const { MongoClient } = require('mongodb');

const indexes = [{
  collection: 'news',
  spec: {
    url: 1,
  },
},
{
  collection: 'steamnews',
  spec: {
    gid: 1,
  },
},
{
  collection: 'webhooks',
  spec: {
    id: 1,
  },
},
{
  collection: 'ytvideos',
  spec: {
    id: 1,
  },
},
{
  collection: 'posts',
  spec: {
    postLink: 1,
  },
},
{
  collection: 'steamapp',
  spec: {
    changenumber: 1,
  },
},
{
  collection: 'reddit',
  spec: {
    name: 1,
  },
},
{
  collection: 'gamepedia',
  spec: {
    rcid: 1,
  },
}];

class Database {
  constructor(config) {
    this.uri = config.uri;
    this.dbname = config.db;
  }

  checkUniqueIndexes() {
    indexes.forEach((i) => {
      try {
        this.db.collection(i.collection).createIndex(i.spec, { unique: 1 });
      } catch (err) {
        if (err.name !== 'MongoError' || !err.message.match(/^E11000/)) {
          this.log.error(err);
        } else {
          this.debug(`${i.spec} already exists`);
        }
      }
    });
  }

  async connect() {
    this.client = await MongoClient.connect(this.uri);
    this.db = await this.client.db(this.dbname);
    this.checkUniqueIndexes();
  }

  insertOne(collection, doc) {
    return this.db.collection(collection).insertOne(doc);
  }
}

module.exports = Database;
