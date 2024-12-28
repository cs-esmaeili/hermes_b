const Token = require('../models/Token');
const { green, red } = require('colors');

const seqNumber = 10;
const board_key = encodeURIComponent(process.env.BOARD_KEY);

const seed = async (app) => {

    await Token.create({ token: board_key, noExpire: true })
    await console.log(`${red(seqNumber)} : ${green('Token seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}