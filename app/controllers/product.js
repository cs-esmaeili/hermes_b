const Product = require("../database/models/Product");
const { calculateProductPrice } = require('../utils/price');
const { mCreateProduct, mUpdateProduct, mSearchProduct } = require('../static/response.json');
const ApiBox = require("../database/models/ApiBox");

exports.productList = async (req, res, next) => {
    try {
        const { page = 1, perPage = 10, category } = req.body;

        let query = { status: { $ne: 2 } };

        const products = await Product.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage)
            .populate({
                path: "category_id",
                match: category ? { name: category } : {}, 
                select: "name"
            })
            .populate("apiBox_id")
            .lean();

        const filteredProducts = category 
            ? products.filter(product => product.category_id) 
            : products; 

        const productsCount = await Product.countDocuments(query);
        
        res.send({ productsCount, products: filteredProducts });
    } catch (err) {
        res.status(err.statusCode || 500).json(err);
    }
};



exports.createProduct = async (req, res, next) => {
    try {
        const { box_id, name, cBuyPrice, cSellPrice, formulaBuy, formulaSell, category_id, disc, image, discount, status, inventory, weight, ayar, ang, ojrat, labName } = req.body;
        console.log(req.body);

        const apiBox = await ApiBox.findOne({ _id: box_id });

        const { buyPrice, sellPrice } = calculateProductPrice({ cBuyPrice, cSellPrice, formulaBuy, formulaSell, discount, ojrat, weight, ayar }, apiBox);

        const result = await Product.create({
            apiBox_id: box_id,
            buyPrice,
            category_id,
            sellPrice,
            cBuyPrice,
            name, cBuyPrice, cSellPrice, formulaBuy, formulaSell, disc, image, discount, status, inventory, weight, ayar, ang, ojrat, labName
        });


        if (result) {
            res.send({ message: mCreateProduct.ok });
            return;
        }
        throw { message: mCreateProduct.fail_1, statusCode: 500 };
    } catch (err) {
        console.log(err);
        if (err.code == 11000) {
            res.status(406).json({ message: mCreateProduct.fail_2, statusCode: 406 });
        } else {
            res.status(err.statusCode || 500).json(err);
        }
    }
}

exports.updateProduct = async (req, res, next) => {
    try {
        const { id, box_id, name, cBuyPrice, cSellPrice, formulaBuy, category_id, formulaSell, disc, image, discount, status, inventory, weight, ayar, ang, ojrat, labName } = req.body;
        const apiBox = await ApiBox.findOne({ _id: box_id });
        const { buyPrice, sellPrice } = calculateProductPrice({ cBuyPrice, cSellPrice, formulaBuy, formulaSell, discount, ojrat, weight, ayar }, apiBox);
        const result = await Product.updateOne({ _id: id }, {
            apiBox_id: box_id, buyPrice, sellPrice,
            name, cBuyPrice, cSellPrice, formulaBuy, category_id, formulaSell, disc, image, discount, status, inventory, weight, ayar, ang, ojrat, labName
        });

        if (result.modifiedCount == 1) {
            res.send({ message: mUpdateProduct.ok });
            return;
        }
        throw { message: mUpdateProduct.fail_2, statusCode: 500 };
    } catch (err) {
        console.log(err);
        res.status(406).json({ message: mUpdateProduct.fail_1, statusCode: 406 });
    }
}

exports.updateAllProductPrices = async () => {
    try {
        const products = await Product.find({}).populate("apiBox_id").lean();
        const updatedProducts = [];

        for (let i = 0; i < products.length; i++) {

            const { buyPrice, sellPrice } = calculateProductPrice(products[i], products[i].apiBox_id);

            products[i].buyPrice = buyPrice;
            products[i].sellPrice = sellPrice;
            updatedProducts.push(products[i]);
        }

        if (updatedProducts.length > 0) {
            await Promise.all(updatedProducts.map(updatedPrice => Product.findByIdAndUpdate(updatedPrice._id, { buyPrice: updatedPrice.buyPrice, sellPrice: updatedPrice.sellPrice })));
        }
    } catch (error) {
        console.error("Error updating products:", error);
    }
}

exports.getProductPrices = async () => {
    const products = await Product.find({}).populate("apiBox_id").lean();
    return products;
}

exports.searchProduct = async (req, res, next) => {
    try {
        const { name } = await req.body;
        const result = await Product.find({ "name": { $regex: `.*${name}.*`, $options: "i" } });

        if (result.length <= 0) {
            throw { message: mSearchProduct.fail, statusCode: 422 };
        }
        res.send(result);
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}