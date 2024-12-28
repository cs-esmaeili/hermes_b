const ApiBox = require('../database/models/ApiBox');
const { calculateBoxPrice } = require('../utils/price');
const { addApiBox, updatedApiBox } = require('../static/response.json');
const { goldPrice } = require('../requests/goldPrice');

exports.getGoldPriceFromAPI = async (req, res, next) => {
    try {
        const { data } = await goldPrice();
        global.apiData = data.result;
    } catch (error) {
        // console.error("Failed to get GoldPrice");
    }
};

exports.apiBoxList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let apiboxs = await ApiBox.find({}).skip((page - 1) * perPage).limit(perPage).lean();
        const apiboxCount = await ApiBox.countDocuments({});
        res.send({ apiboxCount, apiboxs });
    } catch (err) {
        res.status(err.statusCode || 500).json(err);
    }
}

exports.updateApiBox = async (req, res, next) => {
    try {
        const { box_id, name, apiPath, cBuyPrice, cSellPrice, formulaBuy, formulaSell } = req.body;

        const { buyPrice, sellPrice } = calculateBoxPrice({ apiPath, cBuyPrice, cSellPrice, formulaBuy, formulaSell });

        let result = await ApiBox.findOneAndUpdate(
            { _id: box_id },
            {
                name,
                apiPath,
                buyPrice,
                sellPrice,
                cBuyPrice,
                cSellPrice,
                formulaBuy,
                formulaSell
            });

        if (result) {
            res.send({ message: updatedApiBox.ok });
            return;
        }
        throw { message: updatedApiBox.fail, statusCode: 401 };
    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            res.status(406).json({ message: addApiBox.fail, statusCode: 406 });
        } else {
            res.status(err.statusCode || 500).json(err);
        }
    }
}

exports.addApiBox = async (req, res, next) => {
    try {
        const { name, apiPath, cBuyPrice, cSellPrice, formulaBuy, formulaSell } = req.body;

        const { buyPrice, sellPrice } = calculateBoxPrice({ apiPath, cBuyPrice, cSellPrice, formulaBuy, formulaSell });

        let result = await ApiBox.create({
            name,
            apiPath,
            buyPrice,
            sellPrice,
            cBuyPrice,
            cSellPrice,
            formulaBuy,
            formulaSell
        });

        if (result) {
            res.send({ message: addApiBox.ok });
            return;
        }
        throw { message: addApiBox.fail_1, statusCode: 401 };
    } catch (err) {

        if (err.code == 11000) {
            res.status(406).json({ message: addApiBox.fail_2, statusCode: 406 });
        } else {
            res.status(err.statusCode || 500).json(err);
        }
    }
}

exports.updateAllBoxApi = async () => {
    try {
        const boxs = await ApiBox.find({});
        const updatedBoxs = [];

        for (let i = 0; i < boxs.length; i++) {
            const { apiPath } = boxs[i];

            if (apiPath == null || apiPath == "") {
                continue;
            }
            const { buyPrice, sellPrice } = calculateBoxPrice(boxs[i]);

            boxs[i].buyPrice = buyPrice;
            boxs[i].sellPrice = sellPrice;
            updatedBoxs.push(boxs[i]);
        }
        if (updatedBoxs.length > 0) {
            await Promise.all(updatedBoxs.map(updatedPrice => ApiBox.findByIdAndUpdate(updatedPrice._id, { buyPrice: updatedPrice.buyPrice, sellPrice: updatedPrice.sellPrice })));
        }
    } catch (error) {
        console.error("Error updating boxs:", error);
    }
}

exports.getBoxPrices = async () => {
    const products = await ApiBox.find({}).lean();
    return products;
}

