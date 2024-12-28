const VerifyCode = require('../database/models/VerifyCode');
const { checkDelayTime } = require('./checkTime');
const { currentTime } = require('../utils/TimeConverter');
const Token = require('../database/models/Token');
const { mCreateVerifyCode } = require('../static/response.json');
const bcrypt = require('bcryptjs');

exports.createToken = async (unicData, token_id = null) => {
    try {
        const hash = await bcrypt.hash(unicData, 10);
        let result = await Token.find({ _id: token_id });
        if (result.length > 0) {
            result = await Token.updateOne({ _id: token_id }, { token: hash });
            result = await Token.find({ _id: token_id });
            result = result[0];
        } else {
            result = await Token.create({ token: hash });
        }
        return result;
    } catch (error) {
        console.error('Error updating or creating document:', error);
        return false;
    }
}

exports.refreshTokenTime = async (token_id) => {
    const newTime = await currentTime();

    const tokenObject = await Token.findOne({ _id: token_id });

    if (!tokenObject) {
        throw { message: 'Token not found', statusCode: 404 };
    }

    if (tokenObject.updatedAt === newTime) {
        return true;
    }

    const updateResult = await Token.updateOne({ _id: token_id }, { updatedAt: newTime });

    if (updateResult.modifiedCount != 1) {
        throw { message: 'Token time cannot be refreshed', statusCode: 500 };
    }

    return true;
};
exports.verifyToken = async (token) => {
    const tokenObject = await Token.findOne({ token });

    if (tokenObject == null) {
        throw { message: 'Token not Found !', statusCode: 404 };
    }

    if (tokenObject.noExpire == true) {
        return true;
    }

    const timeCheck = checkDelayTime(tokenObject.updatedAt, process.env.USERS_SESSIONS_TIME);
    if (!timeCheck) {
        throw { message: 'Session expired', statusCode: 403 };
    }
    return true;
}

exports.getToken = async (token) => {
    const tokenObject = await Token.findOne({ token });
    if (tokenObject == null) {
        throw { message: 'Token not Found !', statusCode: 404 };
    }
    return tokenObject;
}

exports.createVerifyCode = async (user_id) => {
    const smsCode = await VerifyCode.findOne({ user_id });

    const min = 1000;
    const max = 9999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min + "";
    const hashRandomNumber = await bcrypt.hash(randomNumber, 10);

    if (smsCode) {
        const checkTime = checkDelayTime(smsCode.updatedAt, process.env.SMS_RESEND_DELAY, false);
        if (!checkTime) {
            throw { message: mCreateVerifyCode.fail, statusCode: 404 };
        }
        const result = await VerifyCode.updateOne({ user_id }, { code: hashRandomNumber }, { timestamps: true });
        return { result, code: randomNumber };
    } else {
        const result = await VerifyCode.create({ user_id, code: hashRandomNumber });
        return { result, code: randomNumber };
    }
}
