const { buildSchema } = require("./builder");
const { createToken, createHash } = require("../../utils/token");
const bcrypt = require('bcryptjs');
const Role = require("./Role");
const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    token_id: {
        type: mongoose.ObjectId,
        ref: 'Token',
    },
    role_id: {
        type: mongoose.ObjectId,
        required: true,
        ref: 'Role',
    },
    socket_id: {
        type: String,
        unique: true,
        sparse: true,
    },
    userName: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9]{11}$/;
                return !value || emailRegex.test(value) || phoneRegex.test(value);
            },
            message: (props) =>
                `${props.value} is not a valid email or phone number!`,
        },
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return !value || emailRegex.test(value);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    password: {
        type: String,
    },
    data: {
        image: {
            url: String,
            blurHash: String,
        },
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
        github: String,
        linkedin: String,
        telegram: String,
        instagram: String,
        twitter: String,
    },
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