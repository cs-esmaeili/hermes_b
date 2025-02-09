const mongoose = require("mongoose");
const { buildSchema } = require("./builder");

const CategorySchema = buildSchema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null
    }
});

module.exports = mongoose.model("Category", CategorySchema, 'Category');
