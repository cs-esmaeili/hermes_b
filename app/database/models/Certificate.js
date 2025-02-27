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
    title: {
        type: String,
        require: true,
    },
    status: {
        type: String,
        enum: ["byExam", "paid", "unpaid"],
        default: "unpaid"
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    startDate: {
        type: mongoose.Schema.Types.Mixed,
        require: true,
    },
    endDate: {
        type: mongoose.Schema.Types.Mixed,
        require: true,
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