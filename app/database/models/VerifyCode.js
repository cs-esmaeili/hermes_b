const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

module.exports = mongoose.model("VerifyCode", buildSchema({
    userName: {
        type: String,
        unique: true,
    },
    email: {
        type: String,
        unique: true,
    },
    user_id: {
        type: mongoose.ObjectId,
        unique: true,
        ref: 'User',
    },
    code: {
        type: String,
        required: true,
        max: 255,
    }
}), 'VerifyCode');
