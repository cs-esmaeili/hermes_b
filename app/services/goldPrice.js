const { updateAllProductPrices, getProductPrices } = require('../controllers/product');
const { getBoxPrices, getGoldPriceFromAPI, updateAllBoxApi } = require('../controllers/apibox');

const schedule = require('node-schedule');

exports.goldPriceService = async () => {
    console.log('GoldPriceService started');

    const delay = Number(process.env.GOLD_PRICE_SERVICE_DELAY);

    await getGoldPriceFromAPI();

    schedule.scheduleJob(`*/${delay} * * * * *`, async () => {
        try {
            await getGoldPriceFromAPI();
            await updateAllBoxApi();
            await updateAllProductPrices();

            const productPrices = await getProductPrices();
            const boxPrices = await getBoxPrices();
            
            global.io.emit("apiData", global.apiData);
            global.io.emit("productPrices", productPrices);
            global.io.emit("boxPrices", boxPrices);

        } catch (error) {
            console.error('Error in GoldPriceService: ', error);
        }
    });
};