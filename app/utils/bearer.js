exports.extractBearer = (token) => {
    return token.split(" ")[1];
};