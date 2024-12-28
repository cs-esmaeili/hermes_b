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
    session.startTransaction();
    try {
        // Perform multiple database operations within the transaction
        await querys();

        // Commit the transaction
        await session.commitTransaction();
        // console.log('Transaction committed successfully.');
        session.endSession();
        // console.log('Session closed.');
        return true;
    } catch (error) {
        // Handle any errors

        console.error('Error in transaction:', error);

        // Rollback the transaction
        await session.abortTransaction();
        // console.log('Transaction rolled back.');
        session.endSession();
        // console.log('Session closed.');
        return error;
    }
}