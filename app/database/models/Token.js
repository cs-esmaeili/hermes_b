const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

module.exports = mongoose.model("Token", buildSchema({
    token: {
        type: String,
        required: true,
        max: 255,
    },
    noExpire: {
        type: Boolean,
    }
}), 'Token');