const { buildSchema } = require("./builder");
const { createToken } = require("../../utils/token");
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


schema.statics.createNormalUser = async function (userName) {
    const role = await Role.findOne({ name: "user" });
    const { _id, token } = await createToken(userName);
    const user = await this.create({ token_id: _id, role_id: role._id, userName });
    return user;
};

schema.statics.userPermissions = async function (user_id) {
    const user = await this.findOne({ _id: user_id }).populate({ path: 'role_id', populate: { path: 'permissions' } });
    return user.role_id.permissions;
};

module.exports = mongoose.model("User", schema, 'User');