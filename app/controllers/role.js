const Role = require('../database/models/Role');
const Permission = require('../database/models/Permission');
const User = require('../database/models/User');
const { transaction } = require('../database');
const { mCreateRole, mUpdateRole, mDeleteRole } = require('../static/response.json');

exports.roleList = async (req, res, next) => {
    try {
        const permissions = await Permission.find({}).lean();
        const roles = await Role.find({}).populate('permissions').lean();
        res.send({ roles, permissions });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
}

exports.createRole = async (req, res, next) => {
    try {
        const { name } = req.body;
        const permissions = await Permission.find({}).select('id');
        const result = await Role.create({
            name,
            permissions,
        });
        if (result) {
            res.send({ message: mCreateRole.ok });
            return;
        }
        throw { message: mCreateRole.fail, statusCode: 500 };
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}

exports.deleteRole = async (req, res, next) => {
    try {
        const { role_id, newRole_id } = req.body;
        const result = transaction(async () => {
            const deletedResult = await Role.deleteOne({ _id: role_id });
            if (deletedResult.deletedCount == 0) {
                throw { message: mDeleteRole.fail_1, statusCode: 500 };
            }
            await User.updateMany({ role_id }, { role_id: newRole_id });
        });
        if (result) {
            res.send({ message: mDeleteRole.ok });
            return;
        }
        throw { message: mDeleteRole.fail_2, statusCode: 500 };
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}
exports.updateRole = async (req, res, next) => {
    try {
        const { role_id, name, permissions } = req.body;
        const updateResult = await Role.updateOne({ _id: role_id }, { name, permissions });
        if (updateResult.modifiedCount == 1) {
            res.send({ status: "ok", message: mUpdateRole.ok });
            return;
        }
        throw { message: mUpdateRole.fail, statusCode: 500 };
    } catch (err) {
        res.status(err.statusCode || 422).json(err);
    }
}