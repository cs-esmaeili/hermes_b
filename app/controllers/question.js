const Question = require("../database/models/Question");
const errorHandler = require("../utils/errorHandler");

exports.createQuestion = async (req, res, next) => {
    try {
        const { exam_id, question, options, correctOption } = req.body;

        const newQuestion = await Question.create({
            exam_id,
            question,
            options,
            correctOption
        });

        res.status(201).json({
            message: "Question created successfully",
            question: newQuestion
        });
    } catch (error) {
        errorHandler(res, error, "question", "createQuestion");
    }
};

exports.getQuestions = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        const questions = await Question.find({}).populate("exam_id").skip((page - 1) * perPage).limit(perPage).lean();
        const questionCount = await Question.countDocuments({}).lean();

        res.status(200).json({ questions, questionCount });
    } catch (error) {
        errorHandler(res, error, "question", "getQuestions");
    }
};


exports.updateQuestion = async (req, res, next) => {
    try {
        const { question_id, question, options, correctOption } = req.body;

        const updatedQuestion = await Question.findByIdAndUpdate(
            question_id,
            { question, options, correctOption },
            { new: true, runValidators: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({
            message: "Question updated successfully",
            question: updatedQuestion
        });
    } catch (error) {
        errorHandler(res, error, "question", "updateQuestion");
    }
};

exports.deleteQuestion = async (req, res, next) => {
    try {
        const { questionId } = req.body;

        const deletedQuestion = await Question.findByIdAndDelete(questionId);
        if (!deletedQuestion) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({
            message: "Question deleted successfully"
        });
    } catch (error) {
        errorHandler(res, error, "question", "deleteQuestion");
    }
};
