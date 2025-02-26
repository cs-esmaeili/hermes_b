const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CertificateTemplateSchema = buildSchema({
    name: {
        type: String,
        enum: ["General" , "ICDL"],
        default: "General",
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model("CertificateTemplate", CertificateTemplateSchema, "CertificateTemplate");