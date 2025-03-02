const { createToken, createVerifyCode } = require("../utils/token");
const errorHandler = require("../utils/errorHandler");
const { logEvent } = require("../utils/winston");
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
        }).populate("role_id");

        if (!user) {
            throw { message: 'User not found', statusCode: 404 }
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw { message: 'Invalid password', statusCode: 401 };
        }

        const { _id, token } = await createToken(userName, user.token_id);

        if (user?.role_id != "User")
            logEvent({ method: "logInWithPassword", level: "http", category: "auth", extraData: { userName } })

        return res.json({
            message: 'Login successful',
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        errorHandler(res, err, "auth", "logInWithPassword");
    }
};


exports.resetPasswordStepOne = async (req, res, next) => {
    try {
        const { userName } = await req.body;

        const user = await User.findOne({
            $or: [{ userName: userName }, { email: userName }],
        }).populate("role_id");

        if (!user) {
            throw { message: 'User not found', statusCode: 404 }
        }

        const result = await createVerifyCode(user?.newUser?._id ?? user?._id);

        if (process.env.ONLOCAL === "true") {
            console.log(result.code);
        } else {
            const sms = await SendVerifyCodeSms(user.userName, result.code);
            if (sms.data.status != 1) {
                throw { message: mlogInStepOne.fail_1, statusCode: 422 };
            }
        }

        if (user?.role_id != "User")
            logEvent({ method: "resetPasswordStepOne", level: "http", category: "auth", extraData: { userName } })

        res.json({ message: mlogInStepOne.ok, expireTime: process.env.SMS_RESEND_DELAY });
    } catch (err) {
        errorHandler(res, err, "auth", "resetPasswordStepOne");
    }
}

exports.resetPasswordStepTwo = async (req, res, next) => {
    try {
        const { userName, code, password } = await req.body;

        const user = await User.findOne({
            $or: [{ userName: userName }, { email: userName }],
        }).populate("role_id");;

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

        if (user?.role_id != "User")
            logEvent({ method: "resetPasswordStepTwo", level: "http", category: "auth", extraData: { userName } })

        res.json({
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        errorHandler(res, err, "auth", "resetPasswordStepTwo");
    }
}

exports.logInPhoneStepOne = async (req, res, next) => {
    const methodName = "logInPhoneStepOne";
    try {
        const { userName } = await req.body;
        let user = await User.findOne({ userName }).populate("role_id");;

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

        const checkTime = checkDelayTime(result.result.updatedAt, process.env.SMS_RESEND_DELAY, true);

        if (user?.role_id != "User")
            logEvent({ method: methodName, level: "http", category: "auth", extraData: { userName } })

        res.json({ message: mlogInStepOne.ok, expireTime: checkTime });
    } catch (err) {
        errorHandler(res, err, "auth", methodName);
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

        if (user?.role_id != "User")
            logEvent({ method: "logInPhoneStepTwo", level: "http", category: "auth", extraData: { userName } })

        res.json({
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });

    } catch (err) {
        errorHandler(res, err, "auth", "logInPhoneStepTwo");
    }
}


const verifyGoogleToken = async (accessToken, email) => {
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
};

exports.googleLogInCheckNeedRegister = async (req, res, next) => {
    try {
        const { email, accessToken } = await req.body;

        const isValid = await verifyGoogleToken(accessToken, email);

        if (!isValid) {
            throw { message: "مشکلی در ارتباط با گوگل پیش آمد دوباره تلاش کنید", statusCode: 500 };
        }

        const user = await User.findOne({ email }).populate("role_id");


        if (!user) {
            throw { message: "Need Register", statusCode: 403 };
        }

        const { _id, token } = await createToken(user.userName, user.token_id);
        const userUpdate = await User.updateOne({ _id: user._id }, { token_id: _id });

        logEvent({ method: "googleLogInCheckNeedRegister", level: "http", category: "auth", extraData: { userName: user.userName } })

        res.json({
            userName: user.userName,
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });


    } catch (err) {
        errorHandler(res, err, "auth", "googleLogInCheckNeedRegister");
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
        errorHandler(res, err, "auth", "firstLogInWithGoogleStepOne");
    }
}

exports.firstLogInWithGoogleStepTwo = async (req, res, next) => {
    try {

        const { userName, email, code, password } = await req.body;

        let user = await User.findOne({ $or: [{ userName }, { email }] }).populate("role_id");


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

        if (user?.role_id != "User")
            logEvent({ method: "firstLogInWithGoogleStepTwo", level: "http", category: "auth", extraData: { userName } })

        res.json({
            message: mlogInStepTwo.ok,
            token: finalToken,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        errorHandler(res, err, "auth", "firstLogInWithGoogleStepTwo");
    }
}