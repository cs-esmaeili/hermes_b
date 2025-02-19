const { jalaliToMiladi } = require("./TimeConverter");
const userMiladiTime = encodeURIComponent(process.env.USE_MILADI_TIME);

exports.checkDelayTime = (startTime, delayTime, betweenTimes = true) => {
    try {
        // تبدیل زمان شروع به میلادی در صورت نیاز
        if (userMiladiTime === 'false') {
            startTime = jalaliToMiladi(startTime);
        }

        const start = new Date(startTime);
        const maxTime = new Date(startTime);
        maxTime.setMinutes(maxTime.getMinutes() + parseInt(delayTime));
        const currentTime = new Date();

        // چک کردن دقیق زمان با ثانیه
        if (betweenTimes) {
            // اگر زمان فعلی در بازه [start, maxTime) باشد
            if (currentTime >= start && currentTime < maxTime) {
                // محاسبه زمان باقی مانده به ثانیه
                let remainingSeconds = Math.floor((maxTime - currentTime) / 1000);
                // اگر زمان باقی‌مانده صفر یا منفی باشد، false برگردانید
                if (remainingSeconds <= 0) {
                    return false;
                }
                // تبدیل ثانیه به فرمت hh:mm:ss
                const hrs = String(Math.floor(remainingSeconds / 3600)).padStart(2, '0');
                const mins = String(Math.floor((remainingSeconds % 3600) / 60)).padStart(2, '0');
                const secs = String(remainingSeconds % 60).padStart(2, '0');
                return `${hrs}:${mins}:${secs}`;
            }
        } else {
            // حالت دیگر: در صورتی که زمان فعلی از maxTime گذشته باشد
            if (currentTime >= maxTime) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.log(error);
    }
};
