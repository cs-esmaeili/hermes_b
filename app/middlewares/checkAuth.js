const { extractBearer } = require('./../utils/bearer');
const { refreshTokenTime, getToken } = require('../utils/token');
const { checkUserAccess, getUserFromToken } = require('../utils/user');
const passRoutes = require('./../static/PassRouts.json');

exports.checkRoutePermission = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const currentRoute = req.path;

        if (passRoutes.includes(currentRoute)) {
            next();
            return;
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw { message: 'Bearer Token is missing', statusCode: 401 };
        }

        const bearerToken = extractBearer(authHeader);
        req.token = bearerToken;

        const userCheck = await checkUserAccess(bearerToken, currentRoute);
        if(!userCheck){
            throw { message: 'Access denied: Insufficient permissions', statusCode: 403 };
        }
        const token_id = (await getToken(bearerToken))._id;

        const refresh = await refreshTokenTime(token_id);

        const user = await getUserFromToken(bearerToken);
        req.user = user;
        next();
    } catch (err) {
        console.log(err);
        
        res.status(err.statusCode || 500).json({err});
    }
}