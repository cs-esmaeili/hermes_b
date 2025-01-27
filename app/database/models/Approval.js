const { type } = require("os");
const { buildSchema } = require("./builder");
const mongoose = require("mongoose");


const fileSchema = new mongoose.Schema({
    fieldname: String,
    originalname: String,
    encoding: String,
    mimetype: String,
    buffer: Buffer,
    size: Number
});

const requestSchema = buildSchema({
    user: { type: mongoose.Schema.Types.Mixed },
    method: { type: String, required: true },
    url: { type: String, required: true },
    headers: { type: Map, of: String, default: {} },
    body: { type: mongoose.Schema.Types.Mixed, default: {} },
    query: { type: Map, of: String, default: {} },
    params: { type: Map, of: String, default: {} },
    comment: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    file: fileSchema,
});

requestSchema.methods.toExpressRequest = function () {

    return {
        user: this.user,
        method: this.method,
        originalUrl: this.url,
        headers: Object.fromEntries(Array.from(this.headers || [])), // Convert Map to Array
        body: Object.fromEntries(Array.from(this.body || [])),       // Convert Map to Array
        query: Object.fromEntries(Array.from(this.query || [])),     // Convert Map to Array
        params: Object.fromEntries(Array.from(this.params || [])),   // Convert Map to Array
        file: this.file,
    };
};


module.exports = mongoose.model("Approval", requestSchema, 'Approval');


