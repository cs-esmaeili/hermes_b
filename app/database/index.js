const { connectDB, connection } = require('../../config/database');
const migration = require('./models/');
const seed = require('./seeders');

exports.connect = async (app) => {
    await connectDB();
    await migration();
    await seed(app);
}

exports.transaction = async (querys) => {
    const session = await connection.startSession();
    try {
        session.startTransaction();

        await querys();

        await session.commitTransaction();
        session.endSession();
        return true;
    } catch (error) {
        console.error('Error in transaction:', error);
        await session.abortTransaction();
        session.endSession();
        return error;
    }
}