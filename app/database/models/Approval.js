const mongoose = require("mongoose");
const { buildSchema } = require("./builder");
const UserSchema = require("./User").schema;
const CourseSchema = require("./Course").schema;

const ApprovalSchema = buildSchema({
    user_id: { type: mongoose.ObjectId, required: true, ref: "User" },
    field_id: { type: mongoose.ObjectId, required: true },
    model: { type: String, required: true },
    approval_title: { type: String, required: true },
    approval_comment: { type: String, default: "" },
    approval_status: {
        type: String,
        enum: ["pending", "rejected"],
        default: "pending"
    },
    User: { type: UserSchema, required: false },
    Course: { type: CourseSchema, required: false }
});

ApprovalSchema.post('find', async function (docs, next) {
    for (const doc of docs) {
        if (doc.model && doc[doc.model]) {
            doc[doc.model].approval_title = doc.approval_title || doc[doc.model].approval_title;
            doc[doc.model].approval_comment = doc.approval_comment || doc[doc.model].approval_comment;
            doc[doc.model].approval_status = doc.approval_status || doc[doc.model].approval_status;
        }
    }
    next();
});

ApprovalSchema.post('findOne', async function (doc, next) {
    if (doc && doc.model && doc[doc.model]) {
        doc[doc.model].approval_title = doc.approval_title || doc[doc.model].approval_title;
        doc[doc.model].approval_comment = doc.approval_comment || doc[doc.model].approval_comment;
        doc[doc.model].approval_status = doc.approval_status || doc[doc.model].approval_status;
    }
    next();
});

module.exports = mongoose.model("Approval", ApprovalSchema, "Approval");

