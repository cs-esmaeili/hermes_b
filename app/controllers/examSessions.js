const ExamSession = require('../database/models/ExamSession');
const ExamRestriction = require('../database/models/ExamRestriction');
const Exam = require('../database/models/Exam');
const Question = require('../database/models/Question');
const { checkDelayTime } = require('../utils/checkTime');
const { userHavePermission } = require('../utils/user');


exports.startExam = async (req, res, next) => {
    try {
        const { exam_id } = req.body;
        const user_id = req.user._id;

        const exam = await Exam.findById(exam_id);
        if (!exam) {
            return res.status(404).json({ message: "امتحان مورد نظر یافت نشد." });
        }

        // پیدا کردن محدودیت امتحان برای کاربر
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

        // کاهش تعداد دفعات باقی‌مانده و ذخیره تغییرات
        restriction.remainingAttempts -= 1;
        await restriction.save();

        // انتخاب تصادفی سوالات بر اساس تعداد سوالات تعیین شده در امتحان
        // فرض بر این است که فیلد exam.questionCount موجود است.
        const selectedQuestions = await Question.aggregate([
            { $match: { exam_id: exam._id } },
            { $sample: { size: exam.questionCount } }
        ]);

        // آماده‌سازی آرایه سوالات برای ثبت در جلسه امتحان
        // در اینجا از مقدار 0 برای answer استفاده شده که نشان‌دهنده‌ی "پاسخ داده نشده" است.
        const questionsForSession = selectedQuestions.map(q => ({
            question_id: q._id,
        }));

        // ایجاد یک جلسه امتحان جدید (ExamSession)
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


        let examSession = await ExamSession.findOne(
            {
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

        const remainingTime = await checkDelayTime(examSession.createdAt, examSession.exam_id.duration, true, true);

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
        // فرض بر این است که در body درخواست، sessionId، questionIndex و answer ارسال می‌شود
        const { sessionId, questionIndex, answer } = req.body;
        const user_id = req.user._id;

        // اعتبارسنجی اولیه
        if (typeof sessionId === 'undefined' || typeof questionIndex === 'undefined' || typeof answer === 'undefined') {
            return res.status(400).json({ error: 'مقادیر sessionId، questionIndex و answer الزامی هستند.' });
        }

        // یافتن جلسه آزمون فعال
        const examSession = await ExamSession.findOne({ _id: sessionId, status: 'in-progress', user_id }).populate({
            path: "questions.question_id",
            // فرض می‌کنیم correctOption در Question موجود است
            select: "correctOption"
        });
        if (!examSession) {
            return res.status(404).json({ error: 'جلسه آزمونی یافت نشد یا به پایان رسیده است.' });
        }

        // بررسی معتبر بودن اندیس سوال
        if (questionIndex < 0 || questionIndex >= examSession.questions.length) {
            return res.status(400).json({ error: 'اندیس سوال نامعتبر است.' });
        }

        // به‌روزرسانی پاسخ سوال
        examSession.questions[questionIndex].answer = answer;

        // اگر سوال به‌روزرسانی شده آخرین سوال باشد، وضعیت آزمون را به "completed" تغییر می‌دهیم
        if (questionIndex === examSession.questions.length - 1) {
            examSession.status = "completed";

            // محاسبه تعداد جواب صحیح
            let correctCount = 0;
            examSession.questions.forEach(q => {
                const correntAnswer = +q.question_id.correctOption;
                const currentAnswer = +q.answer;


                // اگر پاسخ ثبت شده صحیح بوده باشد (فرض می‌کنیم q.question_id.correctOption حاوی پاسخ صحیح به صورت رشته است)
                if (
                    q.answer !== null &&
                    q.answer !== "unanswered" &&
                    currentAnswer === correntAnswer
                ) {
                    correctCount++;
                }
            });
            const totalQuestions = examSession.questions.length;
            // نمره را به صورت درصد (از 100) محاسبه می‌کنیم (با گرد کردن به نزدیک‌ترین عدد صحیح)
            examSession.score = Math.round((correctCount / totalQuestions) * 100);
        }

        // ذخیره تغییرات
        await examSession.save();

        return res.status(200).json({
            message: examSession.status === "completed"
                ? 'آزمون به پایان رسید.'
                : 'پاسخ سوال با موفقیت به‌روزرسانی شد.',
            examSession
        });
    } catch (error) {
        next(error);
    }
};


exports.getExamSession = async (req, res, next) => {
    try {
        const user_id = req.user._id;
        const { session_id } = req.body;

        const check = await userHavePermission(req.user._id, "examSessions.getExamSession.others");

        let searchQuery = { _id: session_id, user_id }
        if (check) searchQuery = { _id: session_id }


        let examSession = await ExamSession.findOne(searchQuery)
            .populate({ path: "exam_id" })
            .populate({ path: "questions.question_id" })
            .lean();


        if (!examSession) {
            return res.status(404).json({ message: "جلسه امتحان جاری یافت نشد." });
        }

        return res.status(200).json({ examSession });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطایی رخ داده است." });
    }
};