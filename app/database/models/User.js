const { buildSchema } = require("./builder");
const { createToken } = require("../../utils/token");
const Role = require("./Role");
const mongoose = require("mongoose");


const schema = buildSchema(
    {
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
            sparse: true
        },
        userName: {
            type: String,
            required: true,
            unique: true,
            max: 11,
            min: 11,
        },
        data: {
            image: {
                url: String,
                blurHash: String
            },
            fullName: String,
            nationalCode: String,
            birthday: mongoose.Schema.Types.Mixed,
            shebaNumber: String,
        }
    }
);

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