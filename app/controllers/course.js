const Course = require("../database/models/Course");
const Category = require("../database/models/Category");
const FileManager = require('../class/filemanager');
const fileManager = FileManager.getInstance();
const { getBase64 } = require('@plaiceholder/base64');
const User = require("../database/models/User");

exports.addCourse = async (req, res, next) => {
    try {
        const { courseName, description, level } = await req.body;
        const { file, user: { _id: user_id } } = req;
        let { category_id } = await req.body;

        category_id = (await Category.find({}))[0]._id;


        const uplodedFile = await fileManager.saveFile(file.buffer, {
            uploaderId: user_id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            isPrivate: true,
            folderPath: JSON.stringify(["", "users", user_id, JSON.parse(courseName)]),
        });


        const fileUrl = await fileManager.getPublicFileUrl(uplodedFile[0]._id);
        const filePath = await fileManager.getFilePath(uplodedFile[0]._id, user_id, false);
        const blurHash = "s";//await getBase64(filePath);

        const newCourse = await Course.create({
            teacher_id: user_id,
            courseName,
            description,
            category_id,
            level,
            image: {
                url: fileUrl,
                blurHash
            }
        });

        if (!newCourse) {
            throw { message: 'Course create failed', statusCode: 400 }
        }

        res.json({ message: "Course Created" });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}


exports.editCourse = async (req, res, next) => {
    try {
        const { course_id, courseName, description, category_id, level, metadata } = await req.body;

        const updatedCourse = await Course.findByIdAndUpdate(course_id, { courseName, description, category_id, level, metadata });
        if (!updatedCourse) {
            throw new Error("Course not found");
        }
        res.json({ message: "Course Updated" });
    } catch (error) {
        console.error("Error updating course:", error);
        throw new Error("Failed to update course");
    }
};


exports.changeAvatar = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        let { user_id } = req.body;

        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        const file = await fileManager.saveFile(req.file.buffer, {
            uploaderId: user_id,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            isPrivate: false,
            folderPath: JSON.stringify(["", "users", user_id]),
        });



        const fileUrl = await fileManager.getPublicFileUrl(file[0]._id);
        const filePath = await fileManager.getFilePath(file[0]._id, user_id, false);
        const blurHash = await getBase64(filePath);

        const user = await User.updateOne(
            { _id: user_id },
            {
                $set: {
                    'data.image': {
                        url: fileUrl,
                        blurHash
                    }
                }
            }
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            file
        });

    } catch (error) {
        console.log("Error in Change Avatar : " + error);
    }
};
