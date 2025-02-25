const ExamSession = require("../../app/database/models/ExamSession"); // Adjust the path as needed
const Certificate = require("../../app/database/models/Certificate"); // Adjust the path as needed
const { createPureCertificate } = require("../utils/certificate");
const { checkDelayTime } = require("./checkTime");
const { url } = require("inspector");

/**
 * Ends an exam session by sessionId and userId.
 * It marks the session as completed and calculates the exam score.
 *
 * @param {String} sessionId - The ID of the exam session.
 * @param {String} userId - The ID of the user.
 * @returns {Promise<Object>} - The updated exam session.
 * @throws {Error} - If sessionId is not provided or the exam session is not found.
 */
exports.endExam = async (sessionId, userId) => {
    if (!sessionId) {
        throw new Error('SessionId is required.');
    }

    // پیدا کردن جلسه‌ی آزمون که هنوز در حال اجرا است
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

    // علامت‌گذاری جلسه‌ی آزمون به عنوان تکمیل شده
    examSession.status = "completed";

    // محاسبه امتیاز بر اساس پاسخ‌های صحیح
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

    // ذخیره‌ی جلسه‌ی آزمون به‌روزشده
    await examSession.save();

    const cert = createPureCertificate(examSession.exam_id.title, userId, examSession.score, examSession.exam_id.minScore,
        examSession.user_id.data.image.url,
        examSession.user_id.data.fullName,
        examSession.user_id.data.nationalCode,
        examSession.user_id.data.fatherName
    );

    return { examSession, certificate: cert };
};


/**
 * Checks if an exam session's allowed time has passed and, if so, updates its status.
 * 
 * @param {Object} session - The exam session document (should be lean with populated exam_id).
 * @returns {Promise<Object>} - The original or updated session (lean object).
 */
exports.checkAndUpdateExamSession = async (session) => {
    // Only process sessions that are still in progress and have a populated exam.
    if (session.status !== "in-progress" || !session.exam_id) {
        return session;
    }

    // Get allowed duration from the populated exam (in minutes)
    const duration = session.exam_id.duration;
    // checkDelayTime returns a remaining time string if time remains, or false if time is up.
    const timeLeft = checkDelayTime(session.createdAt, duration, true);

    // If time is up, call the endExam function to update the session status and score.
    if (timeLeft === false) {
        await exports.endExam(session._id, session.user_id);
        // Re-fetch the updated session from the database (with populations)
        const updatedSession = await ExamSession.findById(session._id)
            .populate("user_id")
            .populate("exam_id")
            .lean();
        return updatedSession;
    }

    return session;
};
