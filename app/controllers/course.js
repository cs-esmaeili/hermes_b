const Course = require("../database/models/Course");


exports.addCourse = async (req, res, next) => {
    try {
        const { courseName, description, category_id, level, metadata } = await req.body;
        const newCourse = await Course.create({ teacher_id: req.user._id, courseName, description, category_id, level, metadata });
        if (!newCourse.acknowledged) {
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
