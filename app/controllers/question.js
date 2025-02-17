const Question = require("../database/models/Question");

// Create a new question
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

// Get all questions for a specific exam (Using POST instead of GET)
exports.getQuestionsByExam = async (req, res, next) => {
    try {
        const { examId } = req.body;

        const questions = await Question.find({ exam_id: examId });

        res.status(200).json({
            message: "Questions retrieved successfully",
            questions
        });
    } catch (error) {
        next(error);
    }
};

// Get a single question by ID (Using POST instead of GET)
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

// Update a question (Using POST instead of PUT)
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

// Delete a question (Using POST instead of DELETE)
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
