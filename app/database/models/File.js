const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const FileSchema = buildSchema({
    uploader_id: { type: mongoose.ObjectId, required: true, ref: 'User' },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    isPrivate: { type: Boolean, required: true },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
});

module.exports = mongoose.model("File", FileSchema, 'File');
