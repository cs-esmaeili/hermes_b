const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const QuestionSchema = buildSchema({
    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true
    },
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return Array.isArray(v) && v.length === 4;
            },
            message: props => `تعداد گزینه‌ها باید دقیقا 4 مورد باشد.`
        }
    },
    correctOption: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    }
});

module.exports = mongoose.model("Question", QuestionSchema, "Question");
