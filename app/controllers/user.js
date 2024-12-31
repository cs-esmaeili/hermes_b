const { createToken, createVerifyCode } = require("../utils/token");
const User = require("../database/models/User");
const Role = require("../database/models/Role");
const Box = require("../database/models/Box");
const Factor = require("../database/models/Factor");
const VerifyCode = require("../database/models/VerifyCode");
const { SendVerifyCodeSms } = require("../utils/sms");
const { checkDelayTime } = require("../utils/checkTime");
const { convertPersianNumberToEnglish, updateProductCount } = require("../utils/general");
const { checkUserAccess } = require("../utils/user");
const { transaction } = require('../database');
const bcrypt = require('bcryptjs');

const { mlogInStepOne, mlogInStepTwo, registerPure, updateRegisterPure, mSearchUser, mBuyProducts, mSellProducts } = require('../static/response.json');

exports.createUserWithPassword = async (req, res, next) => {
    try {
        const { userName, password } = req.body;

        let user = await User.findOne({ userName });
        if (user) {
            throw { message: 'User already exists', statusCode: 400 };
        }

        let { newUser, newToken } = await User.createNormalUser(userName, password);

        res.json({
            message: 'User created successfully',
            user: newUser,
            token: newToken.token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
    }
};


exports.logInWithPassword = async (req, res, next) => {
    try {
        const { userName, password } = req.body;
        let user = await User.findOne({ userName });
        if (!user) {
            throw { message: 'User not found or Invalid password', statusCode: 404 };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw { message: 'User not found or Invalid password', statusCode: 404 };
        }
        const { _id, token } = await createToken(userName, user.token_id);

        res.json({
            message: mlogInStepTwo.ok,
            token,
            sessionTime: process.env.USERS_SESSIONS_TIME,
        });
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

exports.securityCheck = async (req, res, next) => {
    try {
        const { route } = await req.body;
        const check = await checkUserAccess(req.token, route);
        const { permissions, information } = await this.userInformation(req.user._id);

        res.json({
            information,
            permissions,
        });
    } catch (err) {
        console.log(err);
        res.status(422).json({ message: mSearchUser.fail });
    }
}


exports.userInformation = async (user_id) => {
    try {
        const permissions = await User.userPermissions(user_id);
        const user = await User.findOne({ _id: user_id }).populate('role_id', '-permissions').lean();
        return {
            permissions,
            information: user
        };

    } catch (err) {
        console.log(err);
    }
}

exports.registerPure = async (req, res, next) => {
    try {
        const { userName, role_id, data } = await req.body;
        let user = await User.findOne({ userName });
        if (user) {
            throw { message: registerPure.fail_1, statusCode: 422 };
        }
        let role = await Role.findOne({ _id: role_id });
        if (!role) {
            throw { message: registerPure.fail_2, statusCode: 422 };
        }
        await User.create({
            userName,
            role_id,
            data
        });
        res.json({ message: registerPure.ok });
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}

exports.userList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let users = await User.find({}).populate('role_id', '-permissions').skip((page - 1) * perPage).limit(perPage).lean();
        const usersCount = await User.countDocuments({});
        res.send({ usersCount, users });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
}

exports.updateRegisterPure = async (req, res, next) => {
    try {
        const { user_id, userName, role_id, data } = await req.body;
        let user = await User.findOne({ _id: user_id });
        if (!user) {
            throw { message: updateRegisterPure.fail_1, statusCode: 422 };
        }
        let newUserName = await User.findOne({ userName, _id: { $ne: user_id } });
        if (newUserName) {
            throw { message: updateRegisterPure.fail_2, statusCode: 422 };
        }
        let role = await Role.findOne({ _id: role_id });
        if (!role) {
            throw { message: updateRegisterPure.fail_3, statusCode: 422 };
        }
        await User.updateOne({ _id: user_id }, {
            userName,
            role_id,
            data
        });
        res.json({ message: updateRegisterPure.ok });
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}

exports.searchUser = async (req, res, next) => {
    try {
        const { phoneNumber = "", name = "" } = await req.body;
        const orConditions = [{ "userName": phoneNumber }];

        if (name) {
            orConditions.push(
                { "data.fullName": name },
                { "data.fullName": { $regex: `.*${name}.*`, $options: "i" } }
            );
        }

        const result = await User.find({
            $or: orConditions
        });

        if (result.length <= 0) {
            throw { message: mSearchUser.fail, statusCode: 422 };
        }
        res.send(result);
    } catch (err) {
        res.status(422).json({ message: mSearchUser.fail });
    }
}


exports.buyProducts = async (req, res, next) => {

    const result = await transaction(async () => {
        const { user_id, time, cardPrice, selectedProducts, delivered } = req.body;

        const transformedProducts = selectedProducts.map(product => {
            return {
                product_id: product._id,
                price: product.price,
                count: product.count
            };
        });

        await Factor.create({
            title: "خرید",
            disc: "خرید طلا",
            type: 1,
            user_id,
            price: cardPrice,
            products: transformedProducts,
            targetTime: convertPersianNumberToEnglish(time),
        });

        if (delivered) {
            return true;
        }

        const transformedProductsR = selectedProducts.map(product => {
            return {
                product_id: product._id,
                count: product.count
            };
        });

        const haveBox = await Box.findOne({ user_id });

        if (haveBox) {
            let prevBoxProducts = haveBox.products;

            const mergedArray = updateProductCount(prevBoxProducts, transformedProductsR, true);

            await Box.updateOne({ user_id }, { user_id, products: mergedArray });
        } else {
            await Box.create({ user_id, products: transformedProductsR });
        }

        return true;
    });


    if (result === true) {
        res.send({ message: mBuyProducts.ok });
    } else {
        res.status(result.statusCode || 422).json({ message: mBuyProducts.fail });
    }
}

exports.sellProducts = async (req, res, next) => {

    const result = await transaction(async () => {

        const { user_id, time, cardPrice, selectedProducts } = req.body;

        const transformedProducts = selectedProducts.map(product => {
            return {
                product_id: product._id,
                price: product.price,
                count: product.count
            };
        });

        await Factor.create({
            title: "فروش",
            disc: "فروش طلا",
            type: 2,
            user_id,
            price: cardPrice,
            products: transformedProducts,
            targetTime: convertPersianNumberToEnglish(time),
        });

        return true;
    });

    console.log(result);

    if (result === true) {
        res.send({ message: mSellProducts.ok });
    } else {
        res.status(result.statusCode || 422).json({ message: mSellProducts.fail });
    }
}


exports.boxProducts = async (req, res, next) => {
    try {
        const { user_id } = await req.body;

        const result = await Box.findOne({ user_id }).populate("products.product_id");

        if (result == null || !result.products) {
            throw { message: mlogInStepOne.fail_1, statusCode: 422 };
        } else {
            res.send(result.products);
        }
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}


exports.sellBoxProducts = async (req, res, next) => {

    const result = await transaction(async () => {

        const { user_id, time, cardPrice, selectedProducts } = req.body;

        const transformedProducts = selectedProducts.map(product => {
            return {
                product_id: product._id,
                price: product.price,
                count: product.count
            };
        });

        await Factor.create({
            title: "فروش",
            disc: "فروش طلا از صندوق",
            type: 3,
            user_id,
            price: cardPrice,
            products: transformedProducts,
            targetTime: convertPersianNumberToEnglish(time),
        });


        const productsToReducFromBox = selectedProducts.map(product => {
            return {
                product_id: product._id,
                count: product.count
            };
        });

        const haveBox = await Box.findOne({ user_id });

        if (!haveBox) return false;

        let boxProducts = haveBox.products;


        const products = updateProductCount(boxProducts, productsToReducFromBox);

        if (products == null || products.length == 0) {
            await Box.deleteOne({ user_id });
        } else {
            await Box.updateOne({ user_id }, { user_id, products });
        }


        return true;
    });


    if (result === true) {
        res.send({ message: mSellProducts.ok });
    } else {
        res.status(result.statusCode || 422).json({ message: mSellProducts.fail });
    }
}

