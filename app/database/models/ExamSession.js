const mongoose = require("mongoose");
const { buildSchema } = require("./builder");
const { checkDelayTime } = require("../../utils/checkTime");
const Exam = require("./Exam");

// Define the schema (make sure buildSchema returns a proper Mongoose Schema)
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
    // New field: the time when the exam session started.
    startTime: {
        type: Date,
        default: Date.now
    }
});


module.exports = mongoose.model("ExamSession", ExamSessionSchema, "ExamSession");
