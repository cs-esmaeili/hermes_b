const mongoose = require('mongoose');

const getEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set.`);
    }
    return encodeURIComponent(value);
};

const constructUri = () => {
    const username = getEnv('DB_USERNAME');
    const password = getEnv('DB_PASSWORD');
    const host = getEnv('HOST');
    const port = getEnv('DATABASE_PORT');
    const database = getEnv('DB_DATABASE');
    const onLocal = process.env.ONLOCAL === 'true';

    const baseUri = `mongodb://${username}:${password}@${host}:${port}/${database}`;
    return onLocal
        ? `${baseUri}?authSource=admin&authMechanism=DEFAULT`
        : baseUri;
};

const uri = constructUri();

const connectDB = async () => {
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('Connected to Database');
};

const checkConnection = () => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`Connection state: ${states[mongoose.connection.readyState]}`);
};

module.exports = {
    connection: mongoose.connection,
    checkConnection,
    connectDB,
};
