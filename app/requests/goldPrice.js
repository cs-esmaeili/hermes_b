const { post, get } = require("./httpServices");

exports.goldPrice = () => {
    return get(`https://studio.persianapi.com/index.php/web-service/common/gold-currency-coin?format=json&limit=100&page=1`);
};
