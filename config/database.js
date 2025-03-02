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
    try {
        await mongoose.connect(uri, {
            useNewUrlParser: true // `useUnifiedTopology` حذف شد
        });
        console.log('✅ Connected to Database');
    } catch (error) {
        console.error('❌ Database Connection Error:', error);
        process.exit(1); // در صورت شکست در اتصال، سرور را متوقف کن
    }
};

const checkConnection = () => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`Connection state: ${states[mongoose.connection.readyState]}`);
};

module.exports = {
    connection: mongoose.connection,
    checkConnection,
    connectDB,
    uri
};
