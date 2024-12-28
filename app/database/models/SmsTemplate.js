const mongoose = require("mongoose");
const { buildSchema } = require("./builder");


module.exports = mongoose.model("SmsTemplate", buildSchema({
    code: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    }
}), 'SmsTemplate');