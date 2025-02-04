const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CourseSchema = buildSchema({
    teacher_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
    category_id: { type: mongoose.ObjectId, required: false, ref: 'Category' },
    courseName: { type: String, required: true },
    description: { type: String, required: true },
    approval_id: { type: mongoose.ObjectId, ref: 'Approval', required: false, default: null },
    courseMaterials: [{
        file_id: { type: mongoose.ObjectId, ref: 'File', required: true },
        title: { type: String, required: true },
        order: { type: Number, required: true },
    }],
    students: [{ type: mongoose.ObjectId, ref: 'User' }],
    status: {
        type: String,
        required: true,
        enum: ['rejected', 'pending', 'live'],
        default: 'pending'
    },
    level: { type: String, required: true },
    image: { url: String, blurHash: String },
});

module.exports = mongoose.model("Course", CourseSchema, 'Course');
