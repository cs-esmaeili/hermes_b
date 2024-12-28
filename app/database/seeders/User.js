const User = require('../models/User');
const Role = require('../models/Role');
const { createToken } = require('../../utils/token');
const { green, red } = require('colors');
const bcrypt = require('bcryptjs');
const { getImageBlurHash } = require('../../utils/file');

const seqNumber = 3;
const seed = async (app) => {
    const role = await Role.find({ name: "coWorker" });
    const result = await createToken(process.env.ADMIN_USERNAME);

    const blurHash = await getImageBlurHash("1.jpg");
    await User.create({
        token_id: result._id,
        userName: process.env.ADMIN_USERNAME,
        role_id: role[0]._id,
        data: {
            fullName: "جواد اسماعیلی",
            image: {
                blurHash,
                url: process.env.BASE_URL + JSON.parse(process.env.STORAGE_LOCATION)[2] + "/1.jpg",
            },
        }
    });
    await console.log(`${red(seqNumber)} : ${green('User seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}