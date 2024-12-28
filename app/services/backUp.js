const schedule = require('node-schedule');
const { backupDatabase } = require('../utils/backUp');

exports.backUpService = async () => {
    console.log('BackUpService started');

    schedule.scheduleJob('0 12 * * *', async () => {
        backupDatabase();
    });
};