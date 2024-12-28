const mongoose = require("mongoose");
const { buildSchema } = require("./builder");


const ProductHistory = new mongoose.Schema({
    product_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Product',
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    weight: {
        type: Number,
        min: 0,
        required: false,
        default: 0,
    },
    count: {
        type: Number,
        required: true,
        min: 1,
    },
}, { _id: false });


module.exports = mongoose.model("Factor", buildSchema({
    title: {
        type: String,
        required: true,
    },
    disc: {
        type: String,
        required: false,
    },
    type: { 
        // 1 pending kharid
        // 2 pending forosh
        // 3 accepted
        // 4 reject
        type: Number,
        required: true,
        default: 0,
    },
    user_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'User',
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    time: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    targetTime: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    products: [ProductHistory],
}), 'Factor');
