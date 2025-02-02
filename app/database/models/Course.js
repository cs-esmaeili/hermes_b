const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CourseSchema = buildSchema({
    teacher_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
    category_id: { type: mongoose.ObjectId, required: false, ref: 'Category' },
    courseName: { type: String, required: true },
    description: { type: String, required: true },
    approval_id: { type: mongoose.ObjectId, ref: 'Approval', required: false, default: null },
    courseMaterials: [{
        title: { type: String, required: true },
        file_id: { type: mongoose.ObjectId, ref: 'File', required: true },
        order: { type: Number, required: true },
        approval_id: { type: mongoose.ObjectId, ref: 'Approval', required: false, default: null },
    }],
    students: [{ type: mongoose.ObjectId, ref: 'User' }],
    state: {
        type: String,
        required: true,
        enum: ['active', 'inactive', 'completed'],
        default: 'inactive'
    },
    level: { type: String, required: true },
    image: { url: String, blurHash: String },
});

module.exports = mongoose.model("Course", CourseSchema, 'Course');
