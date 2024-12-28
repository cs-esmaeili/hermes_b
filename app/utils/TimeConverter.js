var jalaali = require('jalaali-js');

const useMiladiTime = encodeURIComponent(process.env.USE_MILADI_TIME);

exports.convertToUTC = (inputDate) => {
    const dateParts = inputDate.split(' ')[0].split('/');
    const timeParts = inputDate.split(' ')[1].split(':');

    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    const seconds = parseInt(timeParts[2]);

    const localDate = new Date(year, month, day, hours, minutes, seconds);
    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);

    return utcDate.toISOString().slice(0, 19).replace('T', ' ');
}


const refactorFormat = (inputDate) => {
    const parts = inputDate.split(" ");
    const dateParts = parts[0].split("/");
    const timeParts = parts[1].split(":");;

    const year = dateParts[0];
    const month = dateParts[1].padStart(2, "0");
    const day = dateParts[2].padStart(2, "0");

    const h = timeParts[0].padStart(2, "0");
    const m = timeParts[1].padStart(2, "0");
    const s = timeParts[2].padStart(2, "0");

    const formattedDate = `${year}/${month}/${day} ${h}:${m}:${s}`;

    return formattedDate;
}

exports.utcToMiladi = (dateString) => {
    const dateObj = new Date(dateString);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");

    const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
}

exports.utcToJalali = (mildadiTime) => {
    let { jy, jm, jd } = jalaali.toJalaali(mildadiTime);
    const jalaliTime = refactorFormat(`${jy}/${jm}/${jd} ${mildadiTime.getHours()}:${mildadiTime.getMinutes()}:${mildadiTime.getSeconds()}`);
    return jalaliTime;
}

exports.jalaliToMiladi = (jalaliTime) => {
    let time = jalaliTime.split(" ");
    const datePart = time[0].split("/");
    time = time[1];
    let { gy, gm, gd } = jalaali.toGregorian(parseInt(datePart[0]), parseInt(datePart[1]), parseInt(datePart[2]));
    const miladiTime = refactorFormat(`${gy}/${gm}/${gd} ${time}`);
    return miladiTime;
}


exports.currentTime = () => {
    if (useMiladiTime === 'true') {
        return this.utcToMiladi(new Date());
    } else {
        return this.utcToJalali(new Date());
    }
}