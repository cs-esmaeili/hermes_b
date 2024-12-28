const mongoose = require('mongoose');

const username = encodeURIComponent(process.env.DB_USERNAME);
const password = encodeURIComponent(process.env.DB_PASSWORD);
const host = encodeURIComponent(process.env.HOST);
const port = encodeURIComponent(process.env.DATABASE_PORT);
const database = encodeURIComponent(process.env.DB_DATABASE);
const onLocal = encodeURIComponent(process.env.ONLOCAL);

exports.uri = null;
if (onLocal === 'true') {
    uri = `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin&authMechanism=DEFAULT`;
} else {
    uri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
}


const connectDB = async (transaction) => {
    try {
        const result = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected To Database');
    } catch (e) {
        console.log(e);
    }
}
const checkConnection = () => {
    if (mongoose.connection.readyState === 1) {
        console.log('Connection is open');
    } else {
        console.log('Connection is not open');
    }
}
module.exports = {
    connection: mongoose.connection,
    checkConnection,
    connectDB,
    uri,
};