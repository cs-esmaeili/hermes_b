const { logEvent } = require("../utils/winston");
const passLogs = require('./../static/passLog.json');

exports.logMiddleware = (req, res, next) => {
    const currentRoute = req.path;

    // تابع تبدیل الگو به regex که از هر دو نوع پارامتر ":id" و wildcard "*" پشتیبانی می‌کند
    function convertToRegex(dbRoute) {
        const pattern = dbRoute
            .replace(/\*/g, '.*')            // تبدیل '*' به '.*' برای پشتیبانی از wildcard
            .replace(/:[^\s/]+/g, '[^/]+');   // تبدیل پارامترهای ":id" به الگوی regex
        return new RegExp(`^${pattern}$`);
    }

    console.log("Current Route:", currentRoute);

    const isAllowed = passLogs.some((log) => {
        const regex = convertToRegex(log);
        return regex.test(currentRoute);
    });

    console.log("isAllowed:", isAllowed);

    if (isAllowed) {
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
