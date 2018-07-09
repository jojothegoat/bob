'use_strict';

const debug = require('debug')('bob:crawler');
const Jobs = require('./lib/Jobs');

const jobs = new Jobs();

(async () => {
  const agenda = await jobs.createAgenda();
  if (debug.enabled) await agenda.purge();
  jobs.defineJobs();

  agenda.on('ready', () => {
    jobs.log.info('Agenda ready - Starting Jobs');
    agenda.every('*/2 * * * *', 'read news'); // 720 QPD
    agenda.every('* * * * * *', 'read steamnews'); // 86,4K/100K QPD
    agenda.every('* * * * * *', 'read youtube'); // 86,4K/1KK QPD
    agenda.every('* * * * *', 'read forum'); // 1440 QPD
    agenda.every('*/2 * * * * *', 'read reddit'); // 30/60 QPM
    agenda.every('* * * * *', 'read wiki'); // 1440 QPD
    agenda.every('0 * * * *', 'read prices'); // 24/1KK QPD
    agenda.every('* * * * * *', 'read serverstatus'); // 86,4K QPD
    agenda.every('0 * * * *', 'read pricehistory'); // 24 QPD
    agenda.start();
  });
})();
