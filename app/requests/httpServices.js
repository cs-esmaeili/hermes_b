const axios = require('axios');

axios.defaults.headers.common["Authorization"] = `Bearer ${process.env.GOLD_PRICE_API_KEY}`;

axios.interceptors.response.use((response) => {
    return response;
}, (error) => {
    return Promise.reject(error);
});

module.exports = {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete,
    axios: axios,
};
