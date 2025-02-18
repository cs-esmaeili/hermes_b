const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const ExamSessionSchema = buildSchema({
    // mac-address
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
                min: 0,
                max: 4
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
        min:0,
        max:100
    }
});


module.exports = mongoose.model("ExamSession", ExamSessionSchema, "ExamSession");
