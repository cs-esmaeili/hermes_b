const ApiBox = require('../models/ApiBox');
const { green, red, blue } = require('colors');
const permissions = require('../../static/permissions.json');

const seqNumber = 7;
const seed = async (app) => {
    try {
        ApiBox.create({
            name:"طلا 18 عیار",
            apiPath: 137120,
        });
        ApiBox.create({
            name:"طلا 24 عیار",
            apiPath: 137121,
        });

        ApiBox.create({
            name:"مظنه  طلا",
            apiPath: 137119,
        });
        ApiBox.create({
            name:"سکه تمام امامی",
            apiPath: 137137,
        });
        await console.log(`${red(seqNumber)} : ${green('ApiBox seed done')}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    seqNumber,
    seed
}