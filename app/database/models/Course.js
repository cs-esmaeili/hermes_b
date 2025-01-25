const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CourseSchema = buildSchema({
    teacher_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
    courseName: { type: String, required: true },
    description: { type: String, required: true },
    courseMaterials: [{
        file_id: { type: mongoose.ObjectId, ref: 'File', required: true },
        order: { type: Number, required: true }
    }],
    students: [{ type: mongoose.ObjectId, ref: 'User' }], 
    state: {
        type: String,
        required: true,
        enum: ['active', 'inactive', 'completed'], 
        default: 'active'
    },
    category: { type: mongoose.ObjectId, required: true, ref: 'Category' },
    level: { type: String, required: true },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("Course", CourseSchema, 'Course');
