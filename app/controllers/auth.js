const { createToken, createVerifyCode } = require("../utils/token");
const User = require("../database/models/User");
const VerifyCode = require("../database/models/VerifyCode");
const { SendVerifyCodeSms } = require("../utils/sms");
const { checkDelayTime } = require("../utils/checkTime");
const bcrypt = require('bcryptjs');

const { mlogInStepOne, mlogInStepTwo } = require('../static/response.json');


exports.createOrLoginWithPassword = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        let user = await User.findOne({ userName });

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                throw { message: 'Invalid password', statusCode: 404 };
            }

            const { _id, token } = await createToken(userName, user.token_id);
            return res.json({
                message: 'Login successful',
                token,
                sessionTime: process.env.USERS_SESSIONS_TIME,
            });
        } else {
            let { newUser, newToken } = await User.createNormalUser(userName, password);

            return res.json({
                message: 'User created successfully',
                user: newUser,
                token: newToken.token,
                sessionTime: process.env.USERS_SESSIONS_TIME,
            });
        }
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
    }
};


exports.logInPhoneStepOne = async (req, res, next) => {
    try {
        const { userName } = await req.body;
        let user = await User.findOne({ userName });

        if (!user) {
            user = await User.createNormalUser(userName);
        }
        const result = await createVerifyCode(user.newUser._id);

        if (process.env.ONLOCAL === 'true') {
            console.log(result.code);
        } else {
            const sms = await SendVerifyCodeSms(userName, result.code);
            if (sms.data.status != 1) {
                throw { message: mlogInStepOne.fail_1, statusCode: 422 };
            }
        }

        res.json({ message: mlogInStepOne.ok, expireTime: process.env.SMS_RESEND_DELAY });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}

exports.logInPhoneStepTwo = async (req, res, next) => {
    try {
        const { userName, code } = await req.body;
        const user = await User.findOne({ userName }).populate("role_id").lean();
        if (!user) {
            throw { message: mlogInStepTwo.fail_1, statusCode: 404 };
        }
        const verifycode = await VerifyCode.findOne({ user_id: user._id }).lean();
        if (!verifycode) {
            throw { message: mlogInStepTwo.fail_2, statusCode: 404 };
        }
        const codeCheck = await bcrypt.compare(code, verifycode.code);
        if (!codeCheck) {
            throw { message: mlogInStepTwo.fail_3, statusCode: 404 };
        }
        const checkTime = checkDelayTime(verifycode.updatedAt, process.env.SMS_RESEND_DELAY, true);
        if (!checkTime) {
            throw { message: mlogInStepTwo.fail_2, statusCode: 404 };
        }
        const { _id, token } = await createToken(userName, user.token_id);
        const userUpdate = await User.updateOne({ _id: user._id }, { token_id: _id });
        const verifyCodeDelete = await VerifyCode.deleteOne({ user_id: user._id }).lean();
        res.json({
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });

    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }

}