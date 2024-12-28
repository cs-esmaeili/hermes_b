const { getProductPrices } = require('../controllers/product');
const { getBoxPrices } = require('../controllers/apibox');
const { getUserFromToken } = require('../utils/user');
const { verifyToken } = require('../utils/token');
const User = require('../database/models/User');

let io = null;

exports.initSocketService = (socketIo) => {
    io = global.io;
    io.on('connection', async (socket) => {
        const token = socket.handshake.query.token;
        try {

            const checkToken = await verifyToken(token);
            const user = await getUserFromToken(token);
            if (user) {
                const update = await User.updateOne({ _id: user._id }, { socket_id: socket.id });

                if (update.nModified === 0) {
                    throw new Error('Socket ID update failed, no document was modified.');
                }
            }

            globalEmiters(socket.id);

            socket.on('disconnect', async () => {
                await User.updateOne({ _id: user._id }, { $unset: { socket_id: "" } });
            });

        } catch (error) {
            console.error('Authentication error:', error.message);
            socket.emit('authenticationError', { message: 'Authentication failed' });
            socket.disconnect();
        }
    });
};

const globalEmiters = async (socket_id) => {
    const productPrices = await getProductPrices();
    const boxPrices = await getBoxPrices();
    io.to(socket_id).emit("apiData", global.apiData);
    io.to(socket_id).emit("productPrices", productPrices);
    io.to(socket_id).emit("boxPrices", boxPrices);
};
