const { buildSchema } = require("./builder");
const mongoose = require("mongoose");


const ApprovalSchema = buildSchema(
    {
        user_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
        field_id: { type: mongoose.ObjectId, required: true },
        model: { type: String, required: true },
        title: { type: String, required: true },
        comment: { type: String, default: "" },
        status: {
            type: String,
            enum: ['pending', 'rejected'],
            default: 'pending'
        },
        draft: {}
    },
    { strict: false }
);

module.exports = mongoose.model("Approval", ApprovalSchema, 'Approval');