const User = require("../database/models/User");
const Role = require("../database/models/Role");
const Box = require("../database/models/Box");
const Factor = require("../database/models/Factor");
const { convertPersianNumberToEnglish, updateProductCount } = require("../utils/general");
const { checkUserAccess } = require("../utils/user");
const { transaction } = require('../database');

const { mlogInStepOne, mlogInStepTwo, registerPure, updateRegisterPure, mSearchUser, mBuyProducts, mSellProducts } = require('../static/response.json');



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

