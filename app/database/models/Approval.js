const { buildSchema } = require("./builder");
const mongoose = require("mongoose");


// const ApprovalSchema = buildSchema({
//     user_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
//     title: { type: String, required: true },
//     model: { type: String, required: true },
//     comment: { type: String, default: "" },
//     status: {
//         type: String,
//         enum: ['pending', 'rejected'],
//         default: 'pending'
//     }
// });
const ApprovalSchema = buildSchema({}, { strict: false });


module.exports = mongoose.model("Approval", ApprovalSchema, 'Approval');