const Course = require("../database/models/Course");
const Category = require("../database/models/Category");
const FileManager = require('../class/filemanager');
const fileManager = FileManager.getInstance();
const { createApproval } = require('../controllers/approval');
const Approval = require("../database/models/Approval");

exports.addCourse = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const { courseName, description, level } = await req.body;

        const { file: { buffer, originalname, mimetype }, user: { _id: user_id } } = await req;
        let { category_id } = await req.body;

        category_id = (await Category.find({}))[0]._id;


        const uplodedFile = await fileManager.saveFile(buffer, {
            uploaderId: user_id,
            originalName: originalname,
            mimeType: mimetype,
            isPrivate: false,
            folderPath: JSON.stringify(["", "users", user_id, courseName]),
        });


        const fileUrl = await fileManager.getPublicFileUrl(uplodedFile[0]._id);
        const filePath = await fileManager.getFilePath(uplodedFile[0]._id, user_id, false);
        const blurHash = "s";//await getBase64(filePath);


        let newCourse = await Course.create({
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
        const forApproval = newCourse.toObject();

        const approval = await createApproval("ثبت اطلاعات دوره", "Course", user_id, forApproval._id, forApproval);

        if (!newCourse) {
            throw { message: 'Course create failed', statusCode: 400 }
        }

        res.json({ message: "Course Created", course_id: newCourse._id });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}


exports.editCourse = async (req, res, next) => {
    try {
        const { course_id, courseName, description, level } = req.body;
        let { category_id } = await req.body;

        category_id = (await Category.find({}))[0]._id;

        const { file, user: { _id: user_id } } = await req;

        console.log({ course_id, courseName, description, level });


        const existingCourse = await Course.findById(course_id);
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }


        let imageData = existingCourse.image;
        if (file) {
            const { buffer, originalname, mimetype } = file;

            const uploadedFile = await fileManager.saveFile(buffer, {
                uploaderId: user_id,
                originalName: originalname,
                mimeType: mimetype,
                isPrivate: false,
                folderPath: JSON.stringify(["", "users", user_id, courseName]),
            });

            const fileUrl = await fileManager.getPublicFileUrl(uploadedFile[0]._id);
            const filePath = await fileManager.getFilePath(uploadedFile[0]._id, user_id, false);

            imageData = {
                url: fileUrl,
                blurHash: "s"
            };
        }

        const approval = await createApproval("ویرایش اطلاعات دوره", "Course", user_id, course_id, null);

        await Approval.updateOne(
            { _id: approval._id },
            {
                $set: {
                    'draft.courseName': courseName,
                    'draft.description': description,
                    'draft.level': level,
                    'draft.category_id': category_id,
                    'draft.image': imageData,
                }
            }
        );


        res.json({ message: "Course updated", course_id });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
};


exports.courseList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        const courses = await Course.find({ teacher_id: req.user._id })
            .populate("teacher_id")
            .populate("category_id")
            .populate("approval_id")
            .populate({
                path: "courseMaterials.file_id",
                model: "File",
            })
            .populate("students")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        let finalCourses = courses.map(course => {
            if (course.approval_id) {
                return course.approval_id.draft;
            }
            return course;
        });

        const courseCount = await Course.countDocuments({ teacher_id: req.user._id });

        res.send({ courseCount, courses: finalCourses });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};

exports.courseInformation = async (req, res, next) => {
    try {
        let { course_id } = req.body;

        const course = await Course.findOne({ _id: course_id })
            .populate("teacher_id")
            .populate("category_id")
            .populate("approval_id")
            .populate({
                path: "courseMaterials.file_id",
                model: "File",
            })
            .populate("students")
            .lean();


        let finalCourse = course;
        if (course?.approval_id) {
            finalCourse = course.approval_id.draft;
        }


        res.send({
            course: finalCourse
        });
    } catch (err) {
        console.log(err);
    }
}

exports.addTopic = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const { course_id, title, order, isPrivate } = await req.body;
        const { file: { buffer, originalname, mimetype }, user: { _id: user_id } } = await req;

        const course = await Course.findById(course_id);

        const uplodedFile = await fileManager.saveFile(buffer, {
            uploaderId: user_id,
            originalName: originalname,
            mimeType: mimetype,
            isPrivate: isPrivate === 'true' || isPrivate === true,
            folderPath: JSON.stringify(["", "users", user_id, course.courseName]),
        });


        let oldCourseMaterials = course.courseMaterials;
        oldCourseMaterials.push({ title, order, file_id: uplodedFile[0]._id });


        let newCourse = await Course.updateOne(
            { _id: course_id },
            { courseMaterials: oldCourseMaterials }
        );

        if (!newCourse) {
            throw { message: 'Topic create failed', statusCode: 400 }
        }

        res.json({ message: "Topic Created", course_id: newCourse._id });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err);
    }
}

exports.deleteTopic = async (req, res) => {
    try {
        const { course_id, file_id } = req.body;

        if (!course_id || !file_id) {
            return res.status(400).json({ message: "Course ID and File ID are required" });
        }

        const course = await Course.findByIdAndUpdate(
            course_id,
            { $pull: { courseMaterials: { file_id } } },
            { new: true }
        );
        fileManager.deleteFile(file_id, req.user._id);

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        res.json({ message: "Course material deleted successfully", course });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred", error: err.message });
    }
};


exports.editTopic = async (req, res) => {
    try {
        const { course_id, file_id, title, order, changeVisibility } = req.body;

        if (!course_id || !file_id) {
            return res.status(400).json({ message: "Course ID and File ID are required" });
        }

        const course = await Course.findOneAndUpdate(
            { _id: course_id, "courseMaterials.file_id": file_id },
            {
                $set: {
                    "courseMaterials.$.title": title,
                    "courseMaterials.$.order": order
                }
            },
            { new: true }
        );

        if (changeVisibility) {
            fileManager.toggleFilePrivacy(file_id, req.user._id);
        }

        if (!course) {
            return res.status(404).json({ message: "Course or file not found" });
        }

        res.json({ message: "Course material updated successfully", course });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "An error occurred", error: err.message });
    }
};
