const SmsTemplate = require("../database/models/SmsTemplate")
const SmsHistory = require("../database/models/SmsHistory")
const { createSmsTemplate, deleteSmsTemplate, sendSmsToUser, cancelSendSmsToUser } = require('../static/response.json');
const { sendFastSms, scheduleSms, cancelSms } = require('../utils/sms');
const { convertPersianNumberToEnglish } = require('../utils/general');
const errorHandler = require("../utils/errorHandler");

exports.createSmsTemplate = async (req, res, next) => {
    try {
        const { code, name, text } = req.body;
        const result = await SmsTemplate.create({ code, name, text });
        if (result) {
            res.send({ message: createSmsTemplate.ok });
            return;
        }
        throw { message: createSmsTemplate.fail, statusCode: 401 };
    } catch (error) {
        errorHandler(res, error, "smsTemplate", "createSmsTemplate");
    }
}
exports.deleteSmsTemplate = async (req, res, next) => {
    try {
        const { _id } = req.body;
        const result = await SmsTemplate.deleteOne({ _id });

        if (result.deletedCount == 0) {
            throw { message: deleteSmsTemplate.fail, statusCode: 401 };
        }
        res.send({ message: deleteSmsTemplate.ok });
    } catch (error) {
        errorHandler(res, error, "smsTemplate", "deleteSmsTemplate");
    }
}
exports.SmsTemplateList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let templates = await SmsTemplate.find({}).skip((page - 1) * perPage).limit(perPage).lean();
        const templatesCount = await SmsTemplate.countDocuments({});
        res.send({ templatesCount, templates });
    } catch (error) {
        errorHandler(res, error, "smsTemplate", "SmsTemplateList");
    }
}

exports.sendSmsToUser = async (req, res, next) => {
    try {
        const { templateName, phoneNumber, templateCode, params, text, time } = req.body;

        let result = null;
        if (time == false) {
            result = await sendFastSms(phoneNumber, templateCode, params);
            await SmsHistory.create({ phoneNumber, templateName, templateCode, text })
        } else {
            result = await scheduleSms(convertPersianNumberToEnglish(time), phoneNumber, templateName, templateCode, text, params);
        }

        if (result == false) {
            throw { message: sendSmsToUser.fail, statusCode: 401 };
        }
        res.send({ message: sendSmsToUser.ok });
    } catch (error) {
        errorHandler(res, error, "smsTemplate", "sendSmsToUser");
    }
}
exports.cancelSendSmsToUser = async (req, res, next) => {
    try {
        const { job_id } = req.body;

        const result = await cancelSms(job_id);

        if (result == false) {
            throw { message: cancelSendSmsToUser.fail, statusCode: 401 };
        }
        res.send({ message: cancelSendSmsToUser.ok });
    } catch (err) {
        errorHandler(res, error, "smsTemplate", "cancelSendSmsToUser");
    }
}