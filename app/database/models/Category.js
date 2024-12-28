const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

module.exports = mongoose.model("Category", buildSchema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        url: String,
        blurHash: String
    }
}), 'Category');
