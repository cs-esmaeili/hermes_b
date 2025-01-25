const { green, red } = require('colors');
const { utcToJalali, utcToMiladi } = require("../../utils/TimeConverter");

const seqNumber = 8;
const userMiladiTime = encodeURIComponent(process.env.USE_MILADI_TIME);

const converTime = (time) => {
    if (userMiladiTime === 'true') {
        return utcToMiladi(time);
    } else {
        return utcToJalali(time);
    }
}

const seed = async (app) => {


    await console.log(`${red(seqNumber)} : ${green('Factor seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}