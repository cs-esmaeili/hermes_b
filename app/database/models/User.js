const { buildSchema } = require("./builder");
const { createToken } = require("../../utils/token");
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
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^[0-9]{11}$/;
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
        fatherName: String,
        cardNumber: String,
        companyName: String,
        economicCode: Number,
        registrationNumber: Number,
        postalCode: Number,
    },
});

schema.statics.createNormalUser = async function (userName, email = null, password = null) {
    try {
        const [role, tokenObject] = await Promise.all([
            Role.findOne({ name: "User" }),
            createToken(userName),
        ]);

        if (!role) {
            throw new Error("Role not found");
        }

        const userData = {
            token_id: tokenObject._id,
            role_id: role._id,
            userName,
        };

        if (email) {
            userData.email = email; 
        }

        if (password) {
            userData.password = await bcrypt.hash(password, 10);
        }

        const newUser = await this.create(userData);
        return { newUser, newToken: tokenObject };
    } catch (err) {
        console.error("Error creating user:", err);
        throw {
            message: err.message || "Error creating user",
            statusCode: err.statusCode || 500,
        };
    }
};


schema.statics.userPermissions = async function (user_id) {
    const user = await this.findOne({ _id: user_id }).populate({ path: 'role_id', populate: { path: 'permissions' } });
    return user.role_id.permissions;
};

module.exports = mongoose.model("User", schema, 'User');