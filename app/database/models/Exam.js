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
    }
});

module.exports = mongoose.model("Exam", ExamSchema, "Exam");
