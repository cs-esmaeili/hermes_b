const { green, red } = require('colors');
const Course = require('../models/Course');
const CertificateTemplate = require('../models/CertificateTemplate');


const seqNumber = 10;

const seed = async (app) => {


    await CertificateTemplate.create({ name: "General" })
    await CertificateTemplate.create({ name: "ICDL" })

    await console.log(`${red(seqNumber)} : ${green('CertificateTemplate seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}