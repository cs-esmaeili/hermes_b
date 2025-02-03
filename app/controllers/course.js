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

        const approval = await createApproval("ثبت اطلاعات دوره", "Course", user_id, newCourse.toObject());

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
        const { course_id } = req.params; // Get course_id from the request parameters
        const { courseName, description, level, category_id } = req.body;
        const { file, user: { _id: user_id } } = req;
        
        // Check if the course exists
        const existingCourse = await Course.findById(course_id);
        if (!existingCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Set category_id if it's not provided (use the first category in the database)
        const updatedCategoryId = category_id || (await Category.find({}))[0]._id;

        // Prepare file upload logic if a new file is provided
        let imageData = existingCourse.image;
        if (file) {
            const { buffer, originalname, mimetype } = file;

            // Save new file and get its URL
            const uploadedFile = await fileManager.saveFile(buffer, {
                uploaderId: user_id,
                originalName: originalname,
                mimeType: mimetype,
                isPrivate: false,
                folderPath: JSON.stringify(["", "users", user_id, courseName]),
            });

            const fileUrl = await fileManager.getPublicFileUrl(uploadedFile[0]._id);
            const filePath = await fileManager.getFilePath(uploadedFile[0]._id, user_id, false);
            const blurHash = "s"; // Replace with getBase64(filePath) if needed

            // Update the image data
            imageData = {
                url: fileUrl,
                blurHash
            };
        }

        // Update the course with the new details
        const updatedCourse = await Course.findByIdAndUpdate(
            course_id,
            {
                courseName,
                description,
                level,
                category_id: updatedCategoryId,
                image: imageData,
            },
            { new: true } // To return the updated course
        );

        // Create approval for the course update (if necessary)
        await createApproval("ویرایش اطلاعات دوره", "Course", user_id, updatedCourse.toObject());

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
                return course.approval_id;
            }
            return course;
        });

        const courseCount = await Course.countDocuments({ teacher_id: req.user._id });

        res.send({ courseCount, courses: finalCourses });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};
