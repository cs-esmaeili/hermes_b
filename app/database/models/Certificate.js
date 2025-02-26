const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CertificateSchema = buildSchema({
    cert_template_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CertificateTemplate",
        required: true
    },
    examSession_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamSession",
        required: false
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    status: {
        type: String,
        enum: ["paid", "unpaid"],
        default: "unpaid"
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    user: {
        image: {
            url: String,
        },
        fullName: String,
        nationalCode: String,
        fatherName: String,
    },
});

module.exports = mongoose.model("Certificate", CertificateSchema, "Certificate");