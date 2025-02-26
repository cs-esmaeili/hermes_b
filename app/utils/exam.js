const ExamSession = require("../../app/database/models/ExamSession"); // Adjust the path as needed
const Certificate = require("../../app/database/models/Certificate"); // Adjust the path as needed
const { createPureCertificate } = require("../utils/certificate");
const { checkDelayTime } = require("./checkTime");


exports.endExam = async (sessionId, userId) => {
    if (!sessionId) {
        throw new Error('SessionId is required.');
    }

    const examSession = await ExamSession.findOne({
        _id: sessionId,
        status: 'in-progress',
        user_id: userId
    }).populate({
        path: "questions.question_id",
        select: "correctOption"
    })
        .populate("exam_id")
        .populate("user_id");

    if (!examSession) {
        throw new Error('Exam session not found or already completed.');
    }

    examSession.status = "completed";

    let correctCount = 0;
    examSession.questions.forEach(q => {
        const correctAnswer = +q.question_id.correctOption;
        const userAnswer = +q.answer;
        if (
            q.answer !== null &&
            q.answer !== "unanswered" &&
            userAnswer === correctAnswer
        ) {
            correctCount++;
        }
    });
    const totalQuestions = examSession.questions.length;
    examSession.score = Math.round((correctCount / totalQuestions) * 100);
    await examSession.save();


    const cert = createPureCertificate(
        examSession.exam_id.cert_template_id,
        examSession.exam_id._id,
        userId,
        examSession.score,
        "paid",
        examSession.exam_id.minScore,
        examSession.user_id.data.image.url,
        examSession.user_id.data.fullName,
        examSession.user_id.data.nationalCode,
        examSession.user_id.data.fatherName,
        null,
        examSession.createdAt,
        examSession.exam_id.duration
    );

    return { examSession, certificate: cert };
};


exports.checkAndUpdateExamSession = async (session) => {
    if (session.status !== "in-progress" || !session.exam_id) {
        return session;
    }

    const duration = session.exam_id.duration;
    const timeLeft = checkDelayTime(session.createdAt, duration, true);

    if (timeLeft === false) {
        await exports.endExam(session._id, session.user_id);
        const updatedSession = await ExamSession.findById(session._id)
            .populate("user_id")
            .populate("exam_id")
            .lean();
        return updatedSession;
    }

    return session;
};
