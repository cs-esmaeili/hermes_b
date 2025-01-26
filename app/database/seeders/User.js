const User = require('../models/User');
const Role = require('../models/Role');
const Token = require('../models/Token');
const { createHash } = require('../../utils/token');
const { green, red } = require('colors');

const seqNumber = 3;
const seed = async (app) => {
    const role = await Role.find({ name: "Admin" });

    const token1 = await Token.create({ token: "$2a$10$Ua2LtSoxFUmMpHqbBAboR.KPT_yBHCGztaxdBXjFju1MtgzN2Fv6" });
    const token2 = await Token.create({ token: "$2a$10$Ua2LtSoxFUmMpHqbBAboR.KPT_yBHCGztaxdBXjFju1MtgzN2Fv7" });

    const hashedPassword = await createHash("admin", false);
    await User.create({
        token_id: token1._id,
        userName: process.env.ADMIN_USERNAME,
        role_id: role[0]._id,
        password: hashedPassword,
        email: "cs.esmaeili@gmail.com",
        data: {
            fullName: "جواد اسماعیلی",

        }
    });
    await User.create({
        token_id: token2._id,
        userName: "09137378602",
        role_id: role[0]._id,
        password: hashedPassword,
        email: "cs.esmaeili1@gmail.com",
        data: {
            fullName: "اکبر اسماعیلی",
        }
    });
    await console.log(`${red(seqNumber)} : ${green('User seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}