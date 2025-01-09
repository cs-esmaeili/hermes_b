const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const FileAccessSchema = buildSchema({
    file_id: { type: mongoose.ObjectId, required: true, ref: 'File' },
    accessList: [{
        userId: { type: mongoose.ObjectId, required: true, ref: 'User' },
        accessLevel: { type: String, enum: ['read', 'write'], default: 'read' },
        grantedAt: { type: Date, default: Date.now }
    }],
});

module.exports = mongoose.model("FileAccess", FileAccessSchema, 'FileAccess');
