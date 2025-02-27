const ExamSession = require("../../app/database/models/ExamSession");
const Certificate = require("../../app/database/models/Certificate");
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



    const cert = await createPureCertificate({
        cert_template_id: examSession.exam_id.cert_template_id,
        examSession_id: examSession.exam_id._id,
        score: examSession.score,
        status: "byExam",
        user: {
            image: {
                url: examSession.user_id.data.image.url
            },
            fullName: examSession.user_id.data.fullName,
            nationalCode: examSession.user_id.data.nationalCode,
            fatherName: examSession.user_id.data.fatherName
        },
        startDate: null,
        endDate: examSession.createdAt,
        title: examSession.exam_id.certTitle,
    }, examSession.exam_id.minScore, examSession.exam_id.duration);

    if (cert) {
        examSession.cert_id = cert._id
    }
    await examSession.save();

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
