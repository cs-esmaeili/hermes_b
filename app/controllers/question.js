const Question = require("../database/models/Question");

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
        next(error);
    }
};

exports.getQuestions = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;


        const questions = await Question.find({}).populate("exam_id").skip((page - 1) * perPage).limit(perPage).lean();
        const questionCount = await Question.countDocuments({}).lean();

        res.status(200).json({ questions, questionCount });
    } catch (error) {
        next(error);
    }
};



exports.getQuestionById = async (req, res, next) => {
    try {
        const { questionId } = req.body;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        res.status(200).json({
            message: "Question retrieved successfully",
            question
        });
    } catch (error) {
        next(error);
    }
};

exports.updateQuestion = async (req, res, next) => {
    try {
        const { questionId, question, options, correctOption } = req.body;

        const updatedQuestion = await Question.findByIdAndUpdate(
            questionId,
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
        next(error);
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
        next(error);
    }
};
