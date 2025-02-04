const { buildSchema } = require("./builder");
const mongoose = require("mongoose");
const { currentTime } = require("../../utils/TimeConverter");

const ApprovalSchema = buildSchema(
    {
        user_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
        field_id: { type: mongoose.ObjectId, required: true },
        model: { type: String, required: true },
        draft: {
            approval: {
                title: { type: String, required: true },
                comment: { type: String, default: "" },
                status: {
                    type: String,
                    enum: ['pending', 'rejected'],
                    default: 'pending'
                },
                approval_time: { type: mongoose.Schema.Types.Mixed, default: currentTime() }
                //other Data
            }
        }
    },
    { strict: false }
);

module.exports = mongoose.model("Approval", ApprovalSchema, 'Approval');