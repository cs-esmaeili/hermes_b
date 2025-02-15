const mongoose = require("mongoose");
const { buildSchema } = require("./builder");



module.exports = mongoose.model("Post", buildSchema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    imageH: {
        url: String,
        blurHash: String
    },
    imageV: {
        url: String,
        blurHash: String
    },
    disc: {
        type: String,
        required: true,
    },
    metaTags: {
        type: Array,
        required: true,
    },
    category_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Category',
    },
    visibel: {
        type: Boolean,
        default: 0,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    views: {
        type: Number,
        default: 0,
        required: true,
    },
    auther: {
        type: mongoose.ObjectId,
        required: true,
    }
}), 'Post');