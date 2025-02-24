const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const ExamSchema = buildSchema({
    title: {
        type: String,
        required: true,
        unique: true
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
    certificate: {
        type: String,
        required: true,
        default: "ICDL"
    }
});

module.exports = mongoose.model("Exam", ExamSchema, "Exam");
