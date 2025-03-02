const { currentTime } = require("../utils/TimeConverter");
const winston = require("winston");
require("winston-mongodb");
const path = require("path");
const { uri } = require("../../config/database");

const logDir = path.join(process.cwd(), JSON.parse(process.env.LOG_DIR).join(path.sep), "logs.txt");

const fileLogger = winston.createLogger({
    level: "silly",
    format: winston.format.combine(
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: logDir,
            level: "silly" 
        })
    ]
});

let dbLogger = null;
const getDbLogger = () => {
    if (!dbLogger) {
        dbLogger = winston.createLogger({
            level: "silly",
            format: winston.format.combine(
                winston.format.json()
            ),
            transports: [
                new winston.transports.MongoDB({
                    db: uri, 
                    collection: "Log",
                    level: "silly"
                })
            ]
        });
    }
    return dbLogger;
};

const consoleLogger = winston.createLogger({
    level: "silly",
    format: winston.format.combine(
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

const logEvent = ({ onFile = false, onConsole = false, method, level, category, message, extraData = {} }) => {
    const logData = {
        method,
        category,
        message,
        time: currentTime(), 
        ...extraData
    };

    if (onFile) {
        fileLogger.log(level, logData); 
    }

    getDbLogger().log(level, logData); 

    if (onConsole) {
        consoleLogger.log(level, logData);
    }
};


module.exports = { fileLogger, getDbLogger, consoleLogger, logEvent };
