const mongoose = require("mongoose");
const { currentTime } = require("../../utils/TimeConverter");

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
    // توجه: استفاده از timestamps در گزینه‌ها باعث می‌شود mongoose خودش این فیلدها را مدیریت کند
    const schema = new mongoose.Schema(schemaObject, { ...option, timestamps: true });

    // middleware پیش از ذخیره سند
    schema.pre('save', function (next) {
        const currentDate = currentTime();
        if (this.isNew) {
            // در صورت سند جدید، مقداردهی اولیه برای هر دو انجام می‌شود
            this.createdAt = currentDate;
        }
        // در هر ذخیره، updatedAt به روز می‌شود
        this.updatedAt = currentDate;
        next();
    });

    return schema;
};
