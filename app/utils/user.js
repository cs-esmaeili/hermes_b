const { verifyToken, refreshTokenTime, getToken } = require('./token');
const Permission = require('./../database/models/Permission');
const Token = require('./../database/models/Token');
const User = require('./../database/models/User');
const Role = require('./../database/models/Role');
const passRoutes = require('./../static/PassRouts.json');

exports.getUserFromToken = async (token) => {
    const tokenObject = await Token.findOne({ token });

    if (tokenObject == null) {
        throw { message: 'Invalid token', statusCode: 403 };
    }
    const user = await User.findOne({ token_id: tokenObject._id }).populate("token_id").populate("role_id");

    if (tokenObject.noExpire == true && user == null) {
        return false;
    }

    if (user == null) {
        throw { message: 'User not found !', statusCode: 404 };
    }

    return user;
}

exports.checkUserAccess = async (token, route) => {
    if (passRoutes.includes(route)) {
        return true;
    }

    const checkToken = await verifyToken(token);
    const user = await this.getUserFromToken(token);


    const permissions = (await Role.findOne({ _id: user.role_id })).permissions;

    const allPermissions = await Permission.find({ _id: { $in: permissions } });


    function convertToRegex(dbRoute) {
        return new RegExp(`^${dbRoute.replace(/:[^\s/]+/g, '[^/]+')}$`);
    }

    const isAllowed = allPermissions.some((permission) => {
        const regex = convertToRegex(permission.route);
        return regex.test(route);
    });

    if (!isAllowed) {
        return false;
    }

    return true;
};

exports.userHavePermission = async (user_id, permission) => {
    try {
        const user = await User.findById(user_id);
        if (!user) return false;

        const role = await Role.findById(user.role_id);
        if (!role) return false;

        const permissionsIds = role.permissions;

        const perm = await Permission.findOne({
            _id: { $in: permissionsIds },
            route: permission
        });

        return !!perm;
    } catch (error) {
        console.error(error);
        return false;
    }
};
