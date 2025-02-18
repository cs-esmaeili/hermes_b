const mongoose = require("mongoose");

const ExamRestrictionSchema = new mongoose.Schema({
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
    remainingAttempts: {
        type: Number,
        default: 0
    }
});

ExamRestrictionSchema.index({ user_id: 1, exam_id: 1 }, { unique: true });

module.exports = mongoose.model("ExamRestriction", ExamRestrictionSchema, "ExamRestriction");
