const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const SmsHistorySchema = buildSchema({
    phoneNumber: {
        type: Number,
        required: true,
    },
    templateName: {
        type: String,
        required: true,
    },
    templateCode: {
        type: Number,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        default: "ارسال شده"
    },
    time: {
        type: mongoose.Schema.Types.Mixed,
    },
    params: {
        type: Array,
        default: [],
    }
});

module.exports = mongoose.model("SmsHistory", SmsHistorySchema, 'SmsHistory');
