exports.getObjectByKey = (array, key, value) => {
    return array.find(item => item[key] === value);
}


const calculateFormula = (formula, price) => {
    if (formula == "" || formula == null) {
        formula = 'p';
    }
    const replacedFormula = formula.replace(/p/g, price);
    try {
        const result = eval(replacedFormula);
        return result;
    } catch (error) {
        console.error('Error evaluating formula:', error);
        return null;
    }
}


exports.calculateBoxPrice = (box) => {
    try {

        const { apiPath, cBuyPrice, cSellPrice, formulaBuy, formulaSell } = box;

        if (cBuyPrice != 0 && cSellPrice != 0) {
            return { buyPrice: cBuyPrice, sellPrice: cSellPrice }
        }

        let buyPrice = 0;
        let sellPrice = 0;

        if (global.apiData == false || global.apiData == undefined || global.apiData == null || global.apiData.length == 0) {
            return { buyPrice, sellPrice }
        }

        let apiPrice = this.getObjectByKey(global.apiData, 'key', Number(apiPath));

        if (apiPrice == undefined || !apiPrice) {
            return { buyPrice: cBuyPrice, sellPrice: cSellPrice }
        }
        apiPrice = apiPrice.price;
        buyPrice = calculateFormula(formulaBuy, apiPrice);
        sellPrice = calculateFormula(formulaSell, apiPrice);


        if (cBuyPrice != 0) {
            buyPrice = cBuyPrice;
        }
        if (cSellPrice != 0) {
            sellPrice = cSellPrice;
        }


        return { buyPrice, sellPrice }
    } catch (error) {
        console.log(error);
    }
}

exports.calculateProductPrice = (product, apiBox) => {
    try {
        const { cBuyPrice = 0, cSellPrice = 0, formulaBuy, formulaSell, discount = 0, ojrat = 0, weight = 0, ayar = 750 } = product;

        if (!global.apiData || global.apiData.length === 0) {
            return { buyPrice: cBuyPrice, sellPrice: cSellPrice };
        }

        let buyPrice = cBuyPrice !== 0 ? cBuyPrice : calculateFormula(formulaBuy, apiBox.buyPrice);
        let sellPrice = (cSellPrice !== 0 ? cSellPrice : calculateFormula(formulaSell, apiBox.sellPrice)) - discount;


        if (weight != 0) {
            if (ayar == 750) {
                buyPrice = buyPrice * weight;
                sellPrice = (sellPrice * weight) + ojrat
            } else {
                weight = (weight * ayar) / 750;

                buyPrice = buyPrice * weight;
                sellPrice = (sellPrice * weight) + ojrat
            }
        } else {
            sellPrice = sellPrice + ojrat
        }

        return { buyPrice, sellPrice };
    } catch (error) {
        console.error("Error calculating product price:", error);
        return { buyPrice: 0, sellPrice: 0 };
    }
};