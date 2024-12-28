const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

module.exports = mongoose.model("VerifyCode", buildSchema({
    user_id: {
        type: mongoose.ObjectId,
        required: true,
        unique: true,
        ref: 'User',
    },
    code: {
        type: String,
        required: true,
        max: 255,
    }
}), 'VerifyCode');
