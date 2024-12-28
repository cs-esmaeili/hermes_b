const { text } = require('body-parser');
const SmsTemplate = require('../models/SmsTemplate');
const { green, red } = require('colors');

const seqNumber = 9;
const seed = async (app) => {
    await SmsTemplate.create({
        code: 179494,
        name: "کد ورود",
        text: "طاوین کد ورود : #code#"
    });
    await console.log(`${red(seqNumber)} : ${green('SmsTemplate seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}