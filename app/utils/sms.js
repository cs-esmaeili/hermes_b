const schedule = require('node-schedule');
const SmsHistory = require('../database/models/SmsHistory');
const { Smsir } = require('smsir-js');
const { jalaliToMiladi } = require('../utils/TimeConverter');

const smsJobs = new Map();
let phoneLine = "30007732906702";
const smsir = new Smsir(process.env.SMS_API_KEY, phoneLine);

exports.config = async () => {
    try {
        const result = await smsir.getLineNumbers();
        phoneLine = result.data.data[0];
    } catch (error) {
        console.log(error);
    }
};

exports.sendFastSms = async (phoneNumber, template, params) => {
    try {
        const result = await smsir.SendVerifyCode(phoneNumber, template, params);
        return result;
    } catch (error) {
        console.log(error);
        return false;
    }
};

exports.SendVerifyCodeSms = async (phoneNumber, code) => {
    try {
        const result = await this.sendFastSms(phoneNumber, "179494",
            [{
                "name": "CODE",
                "value": code
            }]);
        return result;
    } catch (error) {
        console.log(error);
    }
}

exports.scheduleSms = async (time, phoneNumber, templateName, templateCode, text, params) => {

    const smsHistory = await SmsHistory.create({
        phoneNumber,
        templateName,
        templateCode,
        text,
        time,
        params,
        status: 'در انتظار ارسال'
    });

    const jobId = smsHistory._id;

    if (process.env.USE_MILADI_TIME === "false") {
        time = jalaliToMiladi(time);
    }

    const job = schedule.scheduleJob(time, async () => {
        await SmsHistory.findByIdAndUpdate(jobId, { status: 'ارسال شده' });
        await this.sendFastSms(phoneNumber, templateCode, params);
        smsJobs.delete(jobId);
    });

    smsJobs.set(jobId.toString(), job);
};

exports.cancelSms = async (jobId) => {
    const job = smsJobs.get(jobId);

    if (job) {
        job.cancel();
        await SmsHistory.findByIdAndUpdate(jobId, { status: 'لغو شده' });
        smsJobs.delete(jobId);
        return true;
    } else {
        return false;
    }
};

exports.reloadJobs = async () => {
    const jobs = await SmsHistory.find({ status: 'در انتظار ارسال' });

    jobs.forEach(job => {
        const jobId = job._id;
        let time = job.time;
        const phoneNumber = job.phoneNumber;
        const templateCode = job.templateCode;
        const params = job.params;


        if (process.env.USE_MILADI_TIME === "false") {
            time = jalaliToMiladi(time);
        }

        const scheduledJob = schedule.scheduleJob(time, async () => {
            await this.sendFastSms(phoneNumber, templateCode, params);
            await SmsHistory.findByIdAndUpdate(jobId, { status: 'ارسال شده' });
            smsJobs.delete(jobId.toString());
        });

        smsJobs.set(jobId.toString(), scheduledJob);
    });
};
