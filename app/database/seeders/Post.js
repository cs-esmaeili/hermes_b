const Role = require('../models/Role');
const Category = require('../models/Category');
const User = require('../models/User');
const Post = require('../models/Post');
const { green, red } = require('colors');
const { getImageBlurHash } = require('../../utils/file');

const seqNumber = 5;
const seed = async (app) => {


    await console.log(`${red(seqNumber)} : ${green('Posts seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}