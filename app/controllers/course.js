const Course = require("../database/models/Course");
const Category = require("../database/models/Category");
const FileManager = require('../class/filemanager');
const fileManager = FileManager.getInstance();
const { createApproval } = require('../controllers/approval');

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
        newCourse = newCourse.toObject();

        const approval = await createApproval("ثبت اطلاعات دوره", "Course", user_id, newCourse._id, newCourse);

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
                blurHash
            };
        }

        let updatedCourse = await Course.findByIdAndUpdate(
            course_id,
            {
                courseName,
                description,
                level,
                category_id,
                image: imageData,
            },
            { new: true }
        );
        updatedCourse = updatedCourse.toObject();

        await createApproval("ویرایش اطلاعات دوره", "Course", user_id, updatedCourse._id, updatedCourse);

        res.json({ message: "Course updated", course_id: updatedCourse._id });
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
