const { buildSchema } = require("./builder");
const { createToken, createHash } = require("../../utils/token");
const Role = require("./Role");
const mongoose = require("mongoose");

const validations = [
    {
        statusField: "profileCompletionStatus",
        successStatus: "level_2",
        requiredFields: [
            "data.fullName",
            "data.nationalCode",
            "data.fatherName",
            "data.birthday",
            "data.cardNumber",
            "data.shebaNumber",
            "data.ostan",
            "data.shahr",
            "data.postalCode",
            "data.address",
        ],
    },
];


const schema = buildSchema({
    token_id: {
        type: mongoose.ObjectId,
        ref: 'Token',
    },
    approval_id: {
        type: mongoose.ObjectId,
        ref: 'Approval',
        required: false,
        default: null
    },
    role_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Role',
    },
    userName: {
        type: String,
        unique: true,
        sparse: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
    },
    profileCompletionStatus: {
        type: String,
        required: true,
        enum: ["level_1", "level_2", "level_3", "level_3"],
        default: "level_1"
    },
    data: {
        image: {
            url: String,
            blurHash: String,
        },
        address: String,
        fullName: String,
        nationalCode: String,
        birthday: mongoose.Schema.Types.Mixed,
        shebaNumber: String,
        cardNumber: String,
        fatherName: String,
        companyName: String,
        economicCode: Number,
        registrationNumber: Number,
        postalCode: Number,
        ostan: String,
        shahr: String,
        biography: String,
        github: String,
        linkedin: String,
        telegram: String,
        instagram: String,
        twitter: String,
    },
});

function getMissingFields(userData, requiredFields) {
    return requiredFields.filter(field => {
        const keys = field.split('.');
        let value = userData;
        for (const key of keys) {
            if (value && Object.prototype.hasOwnProperty.call(value, key)) {
                value = value[key];
            } else {
                return true;
            }
        }
        return value === undefined || value === null || value === '';
    });
}

schema.methods.checkProfileCompletion = function (updatedData) {
    const userData = { ...this.toObject(), ...updatedData };

    validations.forEach(validation => {
        const missingFields = getMissingFields(userData, validation.requiredFields);
        console.log(`Missing fields for ${validation.statusField}: `, missingFields);
        const newStatus = missingFields.length === 0 && validation.successStatus;
        if (userData[validation.statusField] !== newStatus) {
            updatedData[validation.statusField] = newStatus;
        }
    });
};

schema.pre('updateMany', async function (next) {
    try {
        const filter = this.getQuery();
        const updateData = this.getUpdate();

        const users = await this.model.find(filter);

        if (!users.length) {
            console.log("No matching users found.");
            return next();
        }

        for (const user of users) {
            user.checkProfileCompletion(updateData['$set']);
        }

        next();
    } catch (error) {
        console.error("Error in updateMany User middleware:", error);
        next(error);
    }
});



schema.pre('save', function (next) {
    if (this.userName === "") {
        this.userName = undefined;
    }
    if (this.email === "") {
        this.email = undefined;
    }
    next();
});

schema.pre('validate', function (next) {
    if (!this.email && !this.userName) {
        return next(
            new Error('At least one of email or userName must be provided.')
        );
    }
    next();
});

schema.statics.createNormalUser = async function (userName = null, email = null, password = null) {
    if (userName == null && email == null) {
        throw new Error("Need email or UserName to create User");
    }
    const [role, tokenObject] = await Promise.all([
        Role.findOne({ name: "User" }),
        createToken(userName ?? email),
    ]);

    if (!role) {
        throw new Error("Role not found");
    }

    const userData = {
        token_id: tokenObject._id,
        role_id: role._id,
    };

    if (userName) {
        userData.userName = userName;
    }
    if (email) {
        userData.email = email;
    }

    if (password) {
        userData.password = await createHash(password);
    }

    const newUser = await this.create(userData);
    return { newUser, newToken: tokenObject };
};

schema.statics.userPermissions = async function (user_id) {
    const user = await this.findOne({ _id: user_id }).populate({ path: 'role_id', populate: { path: 'permissions' } });
    return user.role_id.permissions;
};

module.exports = mongoose.model("User", schema, 'User');
