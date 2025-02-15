const { green, red } = require('colors');
const Course = require('../models/Course');
const User = require('../models/User');
const Category = require('../models/Category');


const seqNumber = 6;

const seed = async (app) => {

    const teacher_id = (await User.find({}))[0]._id;
    const category_id = (await Category.find({}))[0]._id;

    await Course.create({
        teacher_id,
        category_id,
        courseName: "haha",
        description: "توضیحات تست",
        status: "live",
        level: "متوسط",
        image: {
            url: process.env.BASE_URL + JSON.parse(process.env.PUBLIC_DIR)[2] + "/1.jpg",
        },
    });

    await console.log(`${red(seqNumber)} : ${green('Course seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}