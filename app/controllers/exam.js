const Exam = require("../database/models/Exam");
const errorHandler = require("../utils/errorHandler");

exports.createExam = async (req, res, next) => {
    try {
        const { title, duration, certTitle, questionCount, minScore, timeGate, cert_template_id } = req.body;

        const newExam = await Exam.create({
            title,
            duration,
            questionCount,
            timeGate,
            minScore,
            cert_template_id,
            certTitle
        });

        res.status(201).json({
            message: "Exam created successfully",
            exam: newExam
        });
    } catch (error) {
        errorHandler(res, error, "exam", "createExam");
    }
};

exports.getExams = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        const exams = await Exam.find({}).skip((page - 1) * perPage).limit(perPage).lean();
        const examCount = await Exam.countDocuments({}).lean();
        res.send({ examCount, exams });

    } catch (error) {
        errorHandler(res, error, "exam", "getExams");
    }
};

exports.getExamById = async (req, res, next) => {
    try {
        const { examId } = req.body;

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json({
            message: "Exam retrieved successfully",
            exam
        });
    } catch (error) {
        errorHandler(res, error, "exam", "getExamById");
    }
};

exports.updateExam = async (req, res, next) => {
    try {
        const { exam_id, title, duration, certTitle, questionCount, minScore, timeGate, cert_template_id } = req.body;

        const updatedExam = await Exam.findByIdAndUpdate(
            exam_id,
            { title, duration, questionCount, minScore, timeGate, cert_template_id, certTitle },
            { new: true, runValidators: true }
        );

        if (!updatedExam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json({
            message: "Exam updated successfully",
            exam: updatedExam
        });
    } catch (error) {
        errorHandler(res, error, "exam", "updateExam");
    }
};

exports.deleteExam = async (req, res, next) => {
    try {
        const { examId } = req.body;

        const deletedExam = await Exam.findByIdAndDelete(examId);
        if (!deletedExam) {
            return res.status(404).json({ message: "Exam not found" });
        }

        res.status(200).json({
            message: "Exam deleted successfully"
        });
    } catch (error) {
        errorHandler(res, error, "exam", "deleteExam");
    }
};
