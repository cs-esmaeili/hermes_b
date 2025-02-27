const Exam = require("../database/models/Exam");

exports.createExam = async (req, res, next) => {
    try {
        const { title, duration, questionCount, minScore, timeGate, cert_template_id } = req.body;

        const newExam = await Exam.create({
            title,
            duration,
            questionCount,
            timeGate,
            minScore,
            cert_template_id
        });

        res.status(201).json({
            message: "Exam created successfully",
            exam: newExam
        });
    } catch (error) {
        next(error);
    }
};

exports.getExams = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        const exams = await Exam.find({}).skip((page - 1) * perPage).limit(perPage).lean();
        const examCount = await Exam.countDocuments({}).lean();
        res.send({ examCount, exams });

    } catch (error) {
        next(error);
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
        next(error);
    }
};

exports.updateExam = async (req, res, next) => {
    try {
        const { exam_id, title, duration, questionCount, minScore, timeGate, cert_template_id } = req.body;

        const updatedExam = await Exam.findByIdAndUpdate(
            exam_id,
            { title, duration, questionCount, minScore, timeGate, cert_template_id },
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
        next(error);
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
        next(error);
    }
};
