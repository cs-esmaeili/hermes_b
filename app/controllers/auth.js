const { createToken, createVerifyCode } = require("../utils/token");
const User = require("../database/models/User");
const VerifyCode = require("../database/models/VerifyCode");
const { SendVerifyCodeSms } = require("../utils/sms");
const { checkDelayTime } = require("../utils/checkTime");
const { createHash } = require("../utils/token");
const bcrypt = require('bcryptjs');
const axios = require('axios');

const { mlogInStepOne, mlogInStepTwo } = require('../static/response.json');
const Token = require("../database/models/Token");


exports.logInWithPassword = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        const user = await User.findOne({
            $or: [{ userName: userName }, { email: userName }],
        });


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const { _id, token } = await createToken(userName, user.token_id);

        return res.json({
            message: 'Login successful',
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
    }
};



exports.resetPasswordStepOne = async (req, res, next) => {
    try {
        const { userName } = await req.body;

        const user = await User.findOne({
            $or: [{ userName: userName }, { email: userName }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = await createVerifyCode(user?.newUser?._id ?? user?._id);

        if (process.env.ONLOCAL === 'true') {
            console.log(result.code);
        } else {
            const sms = await SendVerifyCodeSms(user.userName, result.code);
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

exports.resetPasswordStepTwo = async (req, res, next) => {
    try {
        const { userName, code, password } = await req.body;

        const user = await User.findOne({
            $or: [{ userName: userName }, { email: userName }],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
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
        const hashPassword = await createHash(password);
        const userUpdate = await User.updateOne({ _id: user._id }, { token_id: _id, password: hashPassword });
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

exports.logInPhoneStepOne = async (req, res, next) => {
    try {
        const { userName } = await req.body;
        let user = await User.findOne({ userName });

        if (!user) {
            user = await User.createNormalUser(userName);
        }

        const result = await createVerifyCode(user?.newUser?._id ?? user?._id);

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


const verifyGoogleToken = async (accessToken, email) => {
    try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const userData = response.data;

        if (userData.email === email && userData.email_verified) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error verifying Google token:', error.message);
        return false;
    }
};

exports.googleLogInCheckNeedRegister = async (req, res, next) => {
    try {
        const { email, accessToken } = await req.body;

        const isValid = true; //  await verifyGoogleToken(accessToken, email);

        if (!isValid) {
            throw { message: "مشکلی در ارتباط با گوگل پیش آمد دوباره تلاش کنید", statusCode: 500 };
        }

        const user = await User.findOne({ email });


        if (!user) {
            throw { message: "Need Register", statusCode: 403 };
        }

        const { _id, token } = await createToken(user.userName, user.token_id);
        const userUpdate = await User.updateOne({ _id: user._id }, { token_id: _id });
        res.json({
            userName: user.userName,
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });


    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}

exports.firstLogInWithGoogleStepOne = async (req, res, next) => {
    try {
        const { email, phoneNumber } = await req.body;

        const result = await createVerifyCode(null, null, email);

        if (process.env.ONLOCAL === 'true') {
            console.log(result.code);
        } else {
            const sms = await SendVerifyCodeSms(phoneNumber, result.code);
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

exports.firstLogInWithGoogleStepTwo = async (req, res, next) => {
    try {

        const { userName, email, code, password } = await req.body;

        let user = await User.findOne({ $or: [{ userName }, { email }] });


        const verifycode = await VerifyCode.findOne({ email }).lean();
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

        let finalToken = null;
        if (!user) {
            const hashPassword = await createHash(password);
            const { newUser, newToken } = await User.createNormalUser(userName, email, hashPassword);
            user = newUser;
            finalToken = newToken;
        } else {
            const hashPassword = await createHash(password);
            await User.updateOne({ _id: user._id }, { password: hashPassword, userName, email });
            finalToken = (await Token.findOne({ _id: user.token_id })).token;
        }

        await VerifyCode.deleteOne({ userName }).lean();
        await VerifyCode.deleteOne({ email }).lean();

        res.json({
            message: mlogInStepTwo.ok,
            token: finalToken,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}