const Role = require('../models/Role');
const Category = require('../models/Category');
const User = require('../models/User');
const Post = require('../models/Post');
const { green, red } = require('colors');
const { getImageBlurHash } = require('../../utils/file');

const seqNumber = 5;
const seed = async (app) => {
    const categorys = await Category.find({});
    const user = (await User.find({}))[0];

    for (let i = 0; i < 10; i++) {
        let category = categorys[(Math.floor(Math.random() * categorys.length))];
        if (i < 20) {
            category = categorys[0];
        } else {
            category = categorys[(Math.floor(Math.random() * categorys.length))];
        }
        const blurHash = await getImageBlurHash("1.jpg");

        await Post.create({
            title: 'Some post ' + i,
            disc: "Velit et velit exercitation deserunt duis ut culpa incididunt excepteur aute.",
            category_id: category._id,
            views: i,
            auther: user._id,
            metaTags: ['haha', "kda"],
            imageH: {
                url: process.env.BASE_URL + JSON.parse(process.env.STORAGE_LOCATION)[2] + "/1.jpg",
                blurHash
            },
            imageV: {
                url: process.env.BASE_URL + JSON.parse(process.env.STORAGE_LOCATION)[2] + "/1.jpg",
                blurHash
            },
            body: [
                { type: "Text", content: "This is text" },
                { type: "Image", content: { url: "http://localhost:3000/storage/1.jpg", blurHash } },
                { type: "Video", content: { url: "http://localhost:3000/storage/3.mp4" } },
            ]
        });
    }

    await console.log(`${red(seqNumber)} : ${green('Posts seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}