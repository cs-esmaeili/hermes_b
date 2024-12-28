const mongoose = require("mongoose");
const { buildSchema } = require("./builder");



module.exports = mongoose.model("Product", buildSchema({
    apiBox_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'ApiBox',
    },
    category_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Category',
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    disc: {
        type: String,
    },
    image: {
        url: String,
        blurHash: String
    },
    status: {
        type: Number,
        default: 0,
        // 0 forosh 
        // 1 adam forosh 
        // 2 invisibel
    },
    buyPrice: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
    },
    sellPrice: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
    },
    cBuyPrice: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
    },
    cSellPrice: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
    },
    formulaBuy: {
        type: String,
        default: "p"
    },
    formulaSell: {
        type: String,
        default: "p"
    },
    discount: {
        type: Number,
        min: 0,
        required: true,
        default: 0,
    },
    ang: {
        type: Number,
        min: 0,
        required: false,
    },
    ojrat: {
        type: String,
        default: "p"
    },
    ayar: {
        type: Number,
        min: 0,
        required: false,
        default: 750,
    },
    labName: {
        type: String,
    },
    inventory: {
        type: Number,
        min: 0,
        required: false,
        default: 0,
    },
    weight: {
        type: Number,
        min: 0,
        required: false,
        default: 0,
    },
}), 'Product');