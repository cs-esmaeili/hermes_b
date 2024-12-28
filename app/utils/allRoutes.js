function getAvailableRoutes(app) {
    const routes = [];
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                method: Object.keys(middleware.route.methods)[0].toUpperCase(),
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    routes.push({
                        path: middleware.mountpath + handler.route.path,
                        method: Object.keys(handler.route.methods)[0].toUpperCase(),
                    });
                }
            });
        }
    });
    return routes;
}

module.exports = getAvailableRoutes;