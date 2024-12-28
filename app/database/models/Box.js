const mongoose = require("mongoose");
const { buildSchema } = require("./builder");


const productSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Product',
    },
    count: {
        type: Number,
        required: true,
        min: 1,
    }
}, { _id: false });


module.exports = mongoose.model("Box", buildSchema({
    user_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'User',
    },
    products: [productSchema]
}), 'Box');