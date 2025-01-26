let appInstance;

module.exports = {
    setApp: (app) => {
        appInstance = app;
    },
    getApp: () => {
        if (!appInstance) {
            throw new Error("App instance is not initialized yet.");
        }
        return appInstance;
    },
};
