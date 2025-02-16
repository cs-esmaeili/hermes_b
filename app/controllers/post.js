const Post = require('../database/models/Post');
const { mCreatePost, mDeletePost, mUpdatePost } = require('../static/response.json');
const { userHavePermission } = require('../utils/user');

exports.createPost = async (req, res, next) => {
    try {
        const { title, disc, category_id, body, metaTags, imageH, imageV } = req.body;

        const result = await Post.create({
            title,
            disc,
            category_id,
            body,
            views: 0,
            metaTags,
            imageH: { url: imageH },
            imageV: { url: imageV },
            auther: req.user._id,
        });
        if (result) {
            res.send({ message: mCreatePost.ok });
            return;
        }
        throw { message: mCreatePost.fail_1, statusCode: 500 };
    } catch (err) {
        console.log(err);

        if (err.code == 11000) {
            res.status(err.statusCode || 422).json({ message: mCreatePost.fail_2 });
        } else {
            res.status(err.statusCode || 422).json(err);
        }
    }
}
exports.deletePost = async (req, res, next) => {
    try {
        const { post_id } = req.body;
        const deletedResult = await Post.deleteOne({ _id: post_id });
        if (deletedResult.deletedCount == 0) {
            throw { message: mDeletePost.fail, statusCode: 500 };
        }
        res.send({ message: mDeletePost.ok });
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}
exports.updatePost = async (req, res, next) => {
    try {
        const { post_id, title, disc, category_id, body, metaTags, imageH, imageV } = req.body;

        const updateResult = await Post.updateOne({ _id: post_id }, {
            title,
            disc,
            category_id: category_id,
            body,
            metaTags,
            imageH: { url: imageH },
            imageV: { url: imageV },
        });
        if (updateResult.modifiedCount == 1) {
            res.send({ message: mUpdatePost.ok });
            return;
        }
        throw { message: mUpdatePost.fail, statusCode: 500 };
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 422).json(err);
    }
}


exports.postList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;



        const check = await userHavePermission(req.user._id, "post.postList.others");

        let searchQuery = { auther: req.user._id, }
        if (check) searchQuery = {}

        const posts = await Post.find(searchQuery).populate('category_id').populate('auther').skip((page - 1) * perPage).limit(perPage).lean();
        for (let post of posts) {
            post.categoryName = post.category_id.name;
        }
        const postsCount = await Post.countDocuments({}).lean();
        res.send({ postsCount, posts });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
}