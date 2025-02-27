const { green, red } = require('colors');

const Exam = require('../models/Exam');
const CertificateTemplate = require('../models/CertificateTemplate');
const Question = require('../models/Question');

const seqNumber = 11;

const seed = async (app) => {
    try {
        const certId = (await CertificateTemplate.find({}))[0];

        const exam = new Exam({
            title: "امتحان نمونه",
            duration: 60,
            questionCount: 3,
            attemptsLimits: 3,
            cert_template_id: certId._id,
            certTitle: "امتحان نمونه برای مدرک"
        });
        await exam.save();

        const questions = [];
        for (let i = 1; i <= 40; i++) {
            questions.push({
                exam_id: exam._id,
                question: `سوال شماره ${i}`,
                options: [
                    `گزینه A برای سوال ${i}`,
                    `گزینه B برای سوال ${i}`,
                    `گزینه C برای سوال ${i}`,
                    `گزینه D برای سوال ${i}`
                ],
                correctOption: Math.floor(Math.random() * 4) + 1
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
