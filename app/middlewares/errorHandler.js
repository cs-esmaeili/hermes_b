const { addLog } = require('../services/logger');

exports.requestHandler = (methodName, callback) => {
    return async (req, res, next) => {
        try {
            await callback(req, res, next);
        } catch (error) {
            addLog("error", methodName, error.message, error.stack);
            res.status(res.statusCode < 400 ? 400 : res.statusCode || 500).send(error);
        }
    }
}

exports.normalhandler = async (methodName, callback) => {
    try {
        return await callback();
    } catch (error) {
        addLog("error", methodName, error.message, error.stack);
    }
};

