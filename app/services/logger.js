const Log = require("../database/models/Log");
const schedule = require('node-schedule');



exports.LogService = async () => {
    console.log('LogService started');

    schedule.scheduleJob('0 0 * * *', async () => {
        deleteOldLogs();
        clearErrorLogs();
    });
};


const deleteOldLogs = async () => {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - 30);

    await Log.deleteMany({ createdAt: { $lt: dateThreshold } });
    console.log('Old logs deleted');
}


const clearErrorLogs = async () => {
    try {
        const result = await Log.deleteMany({ level: "error" });
    } catch (error) {
        console.log("error in Delete Error Logs : ", error);
    }
}

exports.addLog = async (level, location, message, stack_trace = null, user_id) => {
    try {
        const result = await Log.create({ level, location, message, user_id, stack_trace });
    } catch (error) {
        console.log("error in loging : ", error);
    }
}

