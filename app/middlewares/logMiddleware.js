const { logEvent } = require("../utils/winston");
const passLogs = require('./../static/passLog.json');

exports.logMiddleware = (req, res, next) => {

    const currentRoute = req.path;

    function convertToRegex(dbRoute) {
        const pattern = dbRoute
            .replace(/\*/g, '.*')
            .replace(/:[^\s/]+/g, '[^/]+');
        return new RegExp(`^${pattern}$`);
    }

    const needPass = passLogs.some((log) => {
        const regex = convertToRegex(log);
        return regex.test(currentRoute);
    });

    if (needPass) {
        next();
        return;
    }

    const requestDetails = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        user: req.user ? req.user._id : null,
        ip: req.ip,
        userAgent: req.get("user-agent")
    };

    const message = JSON.stringify(requestDetails);

    logEvent({
        onFile: false,
        onConsole: false,
        onDatabase: true,
        method: req.method,
        message: message,
        level: "info"
    });

    next();
};
