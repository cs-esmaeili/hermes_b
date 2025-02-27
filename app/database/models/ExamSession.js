const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const ExamSessionSchema = buildSchema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true
    },
    cert_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Certificate",
        required: false
    },
    questions: [
        {
            question_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
                required: true
            },
            answer: {
                type: String,
                enum: ['1', '2', '3', '4', 'unanswered', null],
                default: null
            }
        }
    ],
    status: {
        type: String,
        enum: ["in-progress", "completed"],
        default: "in-progress"
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
});


module.exports = mongoose.model("ExamSession", ExamSessionSchema, "ExamSession");
