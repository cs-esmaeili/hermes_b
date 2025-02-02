const mongoose = require("mongoose");
const { currentTime } = require("../../utils/TimeConverter");
const { getObjectByKey, performCalculations } = require('../../utils/price');



function addTimestampsToObject(obj) {
    obj.createdAt = {
        type: mongoose.Schema.Types.Mixed,
        set: function () {
            return currentTime();
        }
    };
    obj.updatedAt = {
        type: mongoose.Schema.Types.Mixed,
        set: function () {
            return currentTime();
        }
    };
}


exports.buildSchema = (schemaObject, option) => {
    addTimestampsToObject(schemaObject);
    const schema = new mongoose.Schema(schemaObject, { ...option, timestamps: true });

    const middleware = function (next) {
        const currentDate = currentTime();

        this.createdAt = currentDate;
        this.updatedAt = currentDate;

        next();
    };

    schema.pre('save', middleware);
    return schema;
}