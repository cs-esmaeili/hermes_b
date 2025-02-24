const ExamSession = require('../database/models/ExamSession');
const ExamRestriction = require('../database/models/ExamRestriction');
const Exam = require('../database/models/Exam');
const Question = require('../database/models/Question');
const { checkDelayTime } = require('../utils/checkTime');
const { userHavePermission, checkUserLevel } = require('../utils/user');
const { endExam } = require('../utils/exam');
const { checkAndUpdateExamSession } = require("../utils/exam");

exports.getExamSessions = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        const user_id = req.user._id;

        const hasPermission = await userHavePermission(user_id, "examSessions.getExamSessions.others");
        let searchQuery = { user_id };
        if (hasPermission) {
            searchQuery = {};
        }

        let examSessions = await ExamSession.find(searchQuery)
            .populate("user_id")
            .populate("exam_id")
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        examSessions = await Promise.all(
            examSessions.map(async (session) => {
                return await checkAndUpdateExamSession(session);
            })
        );

        const examSessionCount = await ExamSession.countDocuments(searchQuery);

        res.send({ examSessionCount, examSessions });
    } catch (error) {
        console.log(error);

    }
};

exports.startExam = async (req, res, next) => {
    try {
        const { exam_id } = req.body;
        const user_id = req.user._id;


        const checkLevel = await checkUserLevel(user_id, "level_2");
        if (!checkLevel) {
            return res.status(404).json({ message: "اطلاعات پروفایل شما برای دریافت مدرک کافی نیست", goToProfile: true });
        }

        const exam = await Exam.findById(exam_id);
        if (!exam) {
            return res.status(404).json({ message: "امتحان مورد نظر یافت نشد." });
        }

        let restriction = await ExamRestriction.findOne({ user_id, exam_id });
        if (!restriction) {
            restriction = new ExamRestriction({
                user_id,
                exam_id,
                remainingAttempts: exam.attemptsLimits
            });
            await restriction.save();
        }

        if (restriction.remainingAttempts <= 0) {
            return res.status(400).json({ message: "تعداد دفعات مجاز امتحان به پایان رسیده است." });
        }

        restriction.remainingAttempts -= 1;
        await restriction.save();

        const selectedQuestions = await Question.aggregate([
            { $match: { exam_id: exam._id } },
            { $sample: { size: exam.questionCount } }
        ]);

        const questionsForSession = selectedQuestions.map(q => ({
            question_id: q._id,
        }));

        const examSession = new ExamSession({
            user_id,
            exam_id,
            questions: questionsForSession,
            status: "in-progress",
            score: 0
        });

        await examSession.save();

        return res.status(200).json({
            message: "امتحان با موفقیت شروع شد.",
            examSession
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطایی رخ داده است." });
    }
};

exports.getActiveExamSession = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { session_id } = req.body;

        let examSession = await ExamSession.findOne({
            _id: session_id,
            user_id,
            status: "in-progress"
        })
            .populate({ path: "exam_id" })
            .populate({
                path: "questions.question_id",
                select: "-correctOption"
            })
            .lean();

        if (!examSession) {
            return res.status(404).json({ message: "جلسه امتحان جاری یافت نشد." });
        }

        examSession = await checkAndUpdateExamSession(examSession);

        if (examSession.status !== "in-progress") {
            return res.status(404).json({ message: "زمان امتحان تمام شده است" });
        }

        const remainingTime = checkDelayTime(
            examSession.createdAt,
            examSession.exam_id.duration,
            true,
            true
        );

        if (!remainingTime) {
            return res.status(404).json({ message: "زمان امتحان تمام شده است" });
        }

        examSession.exam_id.duration = remainingTime;
        return res.status(200).json({ examSession });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطایی رخ داده است." });
    }
};



exports.updateQustionAnswer = async (req, res, next) => {
    try {
        const { sessionId, questionIndex, answer } = req.body;
        const user_id = req.user._id;

        if (typeof sessionId === 'undefined' || typeof questionIndex === 'undefined' || typeof answer === 'undefined') {
            return res.status(400).json({ error: 'مقادیر sessionId، questionIndex و answer الزامی هستند.' });
        }

        const examSession = await ExamSession.findOne({ _id: sessionId, status: 'in-progress', user_id })
            .populate({
                path: "questions.question_id",
                select: "correctOption"
            });

        if (!examSession) {
            return res.status(404).json({ error: 'جلسه آزمونی یافت نشد یا به پایان رسیده است.' });
        }

        if (questionIndex < 0 || questionIndex >= examSession.questions.length) {
            return res.status(400).json({ error: 'اندیس سوال نامعتبر است.' });
        }

        examSession.questions[questionIndex].answer = answer;

        if (questionIndex === examSession.questions.length - 1) {
            const updatedSession = await endExam(sessionId, user_id);
            return res.status(200).json({
                message: 'آزمون به پایان رسید.',
                examSession: updatedSession
            });
        } else {
            await examSession.save();
            return res.status(200).json({
                message: 'پاسخ سوال با موفقیت به‌روزرسانی شد.',
                examSession
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.getExamSession = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { session_id } = req.body;

        const hasPermission = await userHavePermission(req.user._id, "examSessions.getExamSession.others");
        let searchQuery = { _id: session_id, user_id, status: "completed" };

        if (hasPermission) searchQuery = { _id: session_id, status: "completed" };

        let examSession = await ExamSession.findOne(searchQuery)
            .populate({ path: "exam_id" })
            .populate({ path: "user_id" })
            .populate({ path: "questions.question_id" })
            .lean();

        if (!examSession) {
            return res.status(404).json({ message: "جلسه امتحان  یافت نشد." });
        }

        if (examSession.status === "in-progress" && examSession.exam_id) {
            examSession = await checkAndUpdateExamSession(examSession);
        }

        return res.status(200).json({ examSession });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطایی رخ داده است." });
    }
};
