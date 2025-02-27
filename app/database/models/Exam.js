const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const ExamSchema = buildSchema({
    cert_template_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CertificateTemplate",
        required: true
    },
    title: {
        type: String,
        required: true,
        unique: true
    },
    certTitle: {
        type: String,
        require: true,
    },
    duration: {
        type: Number,
        required: true
    },
    questionCount: {
        type: Number,
        required: true
    },
    attemptsLimits: {
        type: Number,
        default: 3
    },
    minScore: {
        type: Number,
        default: 30
    },
    timeGate: {
        type: Number,
        default: 30
    },
});

module.exports = mongoose.model("Exam", ExamSchema, "Exam");
