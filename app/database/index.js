const { connectDB, connection } = require('../../config/database');
const migration = require('./models/');
const seed = require('./seeders');

exports.connect = async (app) => {
    await connectDB();
    await migration();
    await seed(app);
}


exports.transaction = async (queries) => {
    const session = await connection.startSession();
    try {
        session.startTransaction();

        // Pass the session to the query function
        await queries(session);

        // Commit the transaction
        await session.commitTransaction();
        return true;
    } catch (error) {
        console.error('Error in transaction:', error);

        // Abort the transaction on error
        await session.abortTransaction();
        throw error; // Re-throw the error to allow the caller to handle it
    } finally {
        // Always end the session
        session.endSession();
    }
};
