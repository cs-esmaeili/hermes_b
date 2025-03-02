const { logEvent } = require("./winston");

module.exports = (res, error, category, method, extraData = null) => {

    const fullError = JSON.stringify(error, Object.getOwnPropertyNames(error));

    let log = {
        onFile: true,
        onDatabase: false,
        message: fullError,
        category,
        method,
        extraData,
        level: "http"
    };


    if (process.env.ONLOCAL === "true") {
        console.log(error);
    } else {
        if (!error.statusCode || error.statusCode == 500) {
            log.level = "error";
        }
        logEvent(log);
    }

    return res.status(error.statusCode || 500).json({
        message: error.message || "Internal server error"
    });
};
