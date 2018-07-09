const debug = require('debug')('bob:serverstatus');
const rp = require('request-promise-native');
require('request-debug')(rp);
const Bobase = require('../Bobase');

if (!debug.enabled) rp.stopDebugging();

class ServerStatusTask extends Bobase {
  constructor(db) {
    super('serverstatus');
    this.db = db;
    this.URL = 'http://www.blessonline.net/api/server_state';
  }

  async insertStatus(status) {
    const newStatus = status;
    newStatus.date = new Date();
    this.db.insertOne('serverstatus', newStatus);
  }

  async getLastStatus() {
    const lookupTable = [];
    const servers = await this.db.db.collection('serverstatus').aggregate([{
      $sort: {
        date: -1,
      },
    }, {
      $group: {
        _id: '$serverName',
        open: {
          $first: '$serverOpen',
        },
        date: {
          $first: '$date',
        },
      },
    }]).toArray();
    servers.forEach((server) => {
      lookupTable[server._id] = server;
    });
    return lookupTable;
  }

  async run() {
    const last = await this.getLastStatus();
    const status = await rp.get(this.URL, {
      json: true,
    }).catch((err) => {
      this.log.warn(err.message);
    });
    this.log.verbose(`Received ${status.length} Servers.`);
    const time = new Date();
    status.forEach((state) => {
      if (last[state.serverName] === undefined
        || (state.serverOpen !== last[state.serverName].open
          && (time - last[state.serverName].date) > 60000)) {
        this.log.info(`Serverstatus of ${state.serverName} changed to ${state.serverOpen}`);
        try {
          this.insertStatus(state);
          this.rc.publish('serverstatus', JSON.stringify(state));
        } catch (err) {
          this.log.error(err);
        }
      }
    });
  }
}

module.exports = ServerStatusTask;
