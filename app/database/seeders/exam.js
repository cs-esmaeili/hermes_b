const { green, red } = require('colors');

// مدل‌های مورد نیاز
const Exam = require('../models/Exam');
const ExamRestriction = require('../models/ExamRestriction');
const ExamSession = require('../models/ExamSession');
const Question = require('../models/Question'); // فرض بر این است که مدل Question وجود دارد و مسیر آن درست است

const seqNumber = 10;

const seed = async (app) => {
    try {
        // پاکسازی داده‌های قبلی
        await Question.deleteMany({});
        await Exam.deleteMany({});
        // (در صورت نیاز سایر مدل‌ها را نیز پاک کنید)

        // ایجاد یک امتحان با 3 سوال (questionCount = 3)
        const exam = new Exam({
            title: "امتحان نمونه",
            duration: 60, // مدت زمان به دقیقه
            questionCount: 3,
            attemptsLimits: 3,
        });
        await exam.save();

        // ایجاد 40 سوال تست با correctOption به صورت تصادفی بین 1 تا 4
        // و اختصاص exam_id به هر سوال
        const questions = [];
        for (let i = 1; i <= 40; i++) {
            questions.push({
                exam_id: exam._id, // مقداردهی exam_id با آی دی امتحان ایجاد شده
                question: `سوال شماره ${i}`,
                options: [
                    `گزینه A برای سوال ${i}`,
                    `گزینه B برای سوال ${i}`,
                    `گزینه C برای سوال ${i}`,
                    `گزینه D برای سوال ${i}`
                ],
                correctOption: Math.floor(Math.random() * 4) + 1 // عدد تصادفی بین 1 تا 4
            });
        }
        await Question.insertMany(questions);

        console.log(`${red(seqNumber)} : ${green('Exam seed done')}`);
    } catch (error) {
        console.error(error);
    }
};

module.exports = {
    seqNumber,
    seed
};
