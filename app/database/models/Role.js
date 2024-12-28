const mongoose = require("mongoose");
const { buildSchema } = require("./builder");


module.exports = mongoose.model("Role", buildSchema({
    name: {
        type: String,
        required: true,
    },
    permissions: {
        type: Array,
        required: true,
        ref: 'Permission',
    }
}), 'Role');