const { getImageBlurHash } = require('../../utils/file');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ApiBox = require('../models/ApiBox');
const { green, red } = require('colors');

const seqNumber = 8;
const seed = async (app) => {
    const blurHash = await getImageBlurHash("1.jpg");
    const apibox = (await ApiBox.find({}))[0];

    const category_id = (await Category.find({}));

    for (let i = 1; i <= 12; i++) {
        await Product.create({
            apiBox_id: apibox._id,
            name: "Product Name " + i,
            disc: "Product disc " + i,
            image: {
                blurHash,
                url: process.env.BASE_URL + JSON.parse(process.env.STORAGE_LOCATION)[2] + "/1.jpg",
            },
            buyPrice: 10000,
            sellPrice: 9000,
            discount: (i % 2 == 0) ? 2000 : 0,
            formulaBuy: "p-10000",
            formulaSell: "p",
            category_id: (i % 2 == 0) ? category_id[0] : category_id[1],
            weight: (Math.round(Math.random())) ? 500 : 0,
        });
    }
    await console.log(`${red(seqNumber)} : ${green('Product seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}