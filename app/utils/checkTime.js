const { jalaliToMiladi } = require("./TimeConverter");
const userMiladiTime = encodeURIComponent(process.env.USE_MILADI_TIME);

exports.checkDelayTime = (startTime, delayTime, betweenTimes = true) => {
    try {
        if (userMiladiTime === 'false') {
            startTime = jalaliToMiladi(startTime);
        }
        let maxTime = new Date(startTime);
        maxTime.setMinutes(parseInt(maxTime.getMinutes()) + parseInt(delayTime));
        maxTime = maxTime.toISOString();

        let currentTime = new Date().toISOString();


        if (betweenTimes == false && (currentTime > maxTime)) {
            return true;
        }
        if (betweenTimes && currentTime >= new Date(startTime).toISOString() && currentTime <= maxTime) {
            return true;
        }
        return false;
    } catch (error) {
        console.log(error);
    }
}