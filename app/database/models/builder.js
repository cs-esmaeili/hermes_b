const mongoose = require("mongoose");
const { currentTime } = require("../../utils/TimeConverter");
const { getObjectByKey, performCalculations } = require('../../utils/price');



function addTimestampsToObject(obj) {
    obj.createdAt = {
        type: mongoose.Schema.Types.Mixed
    };
    obj.updatedAt = {
        type: mongoose.Schema.Types.Mixed,
        set: function () {
            return currentTime();
        }
    };
}

function priceCalculations(doc) {
    try {
        if (('price' in doc || 'discount' in doc) && 'apiData' in doc && global.apiData) {
            if (doc.discount == "" || doc.discount == null) {
                doc.discount = 0;
            }
            const apiPrice = getObjectByKey(global.apiData, "key", Number(doc.apiPath)).price;
            const price = performCalculations(doc, apiPrice);
            doc.price = price;
        }
    } catch (error) {
        console.log(error);
    }
}

exports.buildSchema = (schemaObject) => {
    addTimestampsToObject(schemaObject);
    const schema = new mongoose.Schema(schemaObject, { timestamps: true });

    const middleware = function (next) {
        const currentDate = currentTime();

        this.createdAt = currentDate;
        this.updatedAt = currentDate;

        priceCalculations(this);

        next();
    };

    schema.pre('save', middleware);

    // Pre save hook for update operation
    schema.pre('updateOne', function (next) { priceCalculations(this._update); next(); });

    return schema;
}