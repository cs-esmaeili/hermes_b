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
    status: {
        type: String,
        required: true,
        enum: ['rejected', 'pending', 'live'],
        default: 'pending'
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
        ref: 'User',
    }
}), 'Post');