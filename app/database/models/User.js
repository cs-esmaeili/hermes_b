const { buildSchema } = require("./builder");
const { createToken } = require("../../utils/token");
const { isEmailOrPhone } = require("../../utils/user");
const bcrypt = require('bcryptjs');
const Role = require("./Role");
const mongoose = require("mongoose");

const schema = buildSchema({
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
        required: true,
        unique: true,
        validate: {
            validator: function (value) {
                // Validate if the userName is either an email or a phone number
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9]{11}$/; // Example for 11-digit phone numbers
                return emailRegex.test(value) || phoneRegex.test(value);
            },
            message: (props) =>
                `${props.value} is not a valid email or phone number!`,
        },
    },
    email: {
        type: String,
        validate: {
            validator: function (value) {
                // Optional validation for email if provided
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return !value || emailRegex.test(value);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: function (value) {
                const phoneRegex = /^[0-9]{11}$/;
                return !value || phoneRegex.test(value);
            },
            message: (props) =>
                `${props.value} is not a valid 11-digit phone number!`,
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
        fatherName: String,
        cardNumber: String,
        companyName: String,
        economicCode: Number,
        registrationNumber: Number,
        postalCode: Number,
    },
});


schema.statics.createNormalUser = async function (userName, password = null) {
    try {
        const role = await Role.findOne({ name: "User" });
        const tokenObject = await createToken(userName);
        const userNameType = await isEmailOrPhone(userName);
        const userData = {
            token_id: tokenObject._id,
            role_id: role._id,
            userName,
        };
        if (userNameType === "phone") {
            userData.phoneNumber = userName;
        } else if (userNameType === "email") {
            userData.email = userName;
        } else {
            throw { message: "Invalid username type", statusCode: 400 };
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            userData.password = hashedPassword;
        }
        const user = await this.create(userData);
        return { newUser: user, newToken: tokenObject };
    } catch (err) {
        console.error(err);
        throw { message: err.message || "Error creating user", statusCode: 500 };
    }
};

schema.statics.userPermissions = async function (user_id) {
    const user = await this.findOne({ _id: user_id }).populate({ path: 'role_id', populate: { path: 'permissions' } });
    return user.role_id.permissions;
};

module.exports = mongoose.model("User", schema, 'User');