const SmsHistory = require("../database/models/SmsHistory")
const errorHandler = require("../utils/errorHandler");
const { deleteSmsHistory } = require('../static/response.json');

exports.smsHistoryList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let historys = await SmsHistory.find({}).skip((page - 1) * perPage).limit(perPage).lean();
        const historysCount = await SmsHistory.countDocuments({});
        res.send({ historysCount, historys });
    } catch (error) {
        errorHandler(res, error, "smsHistory", "smsHistoryList");
    }
}

exports.deleteSmsHistory = async (req, res, next) => {
    const { smsHistory_id } = req.body;
    try {
        const deletedResult = await SmsHistory.deleteOne({ _id: smsHistory_id });
        if (deletedResult.deletedCount == 0) {
            throw { message: deleteSmsHistory.fail, statusCode: 500 };
        }
        res.send({ message: deleteSmsHistory.ok });
    } catch (error) {
        errorHandler(res, error, "smsHistory", "deleteSmsHistory");
    }
}