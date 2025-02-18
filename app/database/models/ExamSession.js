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
    questions: [
        {
            question_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Question",
                required: true
            },
            answer: {
                type: Number,
                required: true,
                min: 1,
                max: 4
            }
        }
    ],
    attemptsLimits: {
        type: Number,
        default: 3
    },
    questionCount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["not-started", "in-progress", "completed"],
        default: "not-started"
    },
    score: {
        type: Number,
        default: 0
    }
});

// ExamSessionSchema.index({ exam_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("ExamSession", ExamSessionSchema, "ExamSession");
