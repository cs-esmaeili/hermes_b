const { buildSchema } = require("./builder");
const mongoose = require("mongoose");


const ApprovalSchema = buildSchema({}, { strict: false });


module.exports = mongoose.model("Approval", ApprovalSchema, 'Approval');