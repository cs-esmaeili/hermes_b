const VerifyCode = require('../database/models/VerifyCode');
const { checkDelayTime } = require('./checkTime');
const { currentTime } = require('../utils/TimeConverter');
const Token = require('../database/models/Token');
const bcrypt = require('bcryptjs');

exports.createHash = async (unicData, safe = true) => {
    let hash = await bcrypt.hash(unicData, 10);
    if (safe) {
        hash = hash
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
            .replace(/\./g, '');
    }
    return hash;
};

exports.createToken = async (unicData, token_id = null) => {
    try {
        hash = await this.createHash(unicData);
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


exports.createVerifyCode = async (user_id, userName, email) => {
    const existingCode = await VerifyCode.findOne({ $or: [{ user_id }, { userName }, { email }] });

    if (existingCode) {
        const checkTime = checkDelayTime(existingCode.updatedAt, process.env.SMS_RESEND_DELAY, false);
        if (!checkTime) {
            throw { message: 'ارسال کد جدید در این زمان مقدور نیست', statusCode: 404 };
        }
        const randomNumber = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000 + "";
        const hashRandomNumber = await this.createHash(randomNumber);

        const result = await VerifyCode.updateOne({ user_id }, { code: hashRandomNumber }, { timestamps: true });
        return { result, code: randomNumber };
    } else {
        const randomNumber = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000 + "";
        const hashRandomNumber = await this.createHash(randomNumber);


        let verifycodeCreation = { code: hashRandomNumber };
        if (user_id) verifycodeCreation.user_id = user_id;
        if (userName) verifycodeCreation.userName = userName;
        if (email) verifycodeCreation.email = email;
        const result = await VerifyCode.create(verifycodeCreation);
        return { result, code: randomNumber };
    }
}
