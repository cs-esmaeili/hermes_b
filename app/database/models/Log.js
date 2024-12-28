const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

module.exports = mongoose.model("Log", buildSchema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    level: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    stack_trace: {
        type: String,
        required: false
    },
}), 'Log');