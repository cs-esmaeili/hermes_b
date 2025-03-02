const Role = require('../database/models/Role');
const { mTogglePermission } = require('../static/response.json');
const errorHandler = require("../utils/errorHandler");

exports.togglePermission = async (req, res, next) => {
    const { role_id, permission_id } = req.body;
    try {
        let permissions = (await Role.findOne({ _id: role_id }));
        if (permissions == null) {
            throw { message: mTogglePermission.fail_1, statusCode: 401 };
        }
        permissions = permissions.permissions;
        let result = null;
        if (permissions.includes(permission_id)) {
            permissions.splice(permissions.indexOf(permission_id), 1);
            result = await Role.updateOne({ _id: role_id }, { permissions });
        } else {
            permissions.push(permission_id);
            result = await Role.updateOne({ _id: role_id }, { permissions });
        }
        if (result.modifiedCount == 1) {
            res.send({ message: mTogglePermission.ok });
            return;
        }
        throw { message: mTogglePermission.fail_1, statusCode: 401 };
    } catch (error) {
        errorHandler(res, error, "permission", "togglePermission");
    }
}