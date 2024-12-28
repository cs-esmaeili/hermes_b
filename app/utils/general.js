const User = require('../database/models/User');
const Token = require('../database/models/Token');

exports.convertPersianNumberToEnglish = (input) => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    return input.replace(/[۰-۹]/g, (char) => {
        return englishNumbers[persianNumbers.indexOf(char)];
    });
}


exports.updateProductCount = (a, b, add) => {

    let list = [];

    a.forEach(item => {

        const productIndex = list.findIndex(p => p.product_id == item.product_id);

        if (productIndex != -1) {

            const product = list[productIndex];
            product.count = add ? product.count + item.count : product.count - item.count;

            console.log("product = " + product);

            if (product.count <= 0) {
                list.splice(productIndex, 1);
            }
        } else {
            list.push(item);
        }

    });

    b.forEach(item => {

        const productIndex = list.findIndex(p => p.product_id == item.product_id);

        if (productIndex != -1) {

            const product = list[productIndex];
            product.count = add ? product.count + item.count : product.count - item.count;

            console.log("product = " + product);

            if (product.count <= 0) {
                list.splice(productIndex, 1);
            }
        } else {
            list.push(item);
        }

    });


    return list;

}

exports.getMainPartOfUrl = (url) => {
    // Remove 'http://' or 'https://'
    url = url.replace(/^https?:\/\//, '');

    // Remove 'www.'
    url = url.replace(/^www\./, '');

    url = url.replace('/', '');
    // Remove domain suffix (e.g., '.com', '.ir') from the end
    url = url.replace(/\.[a-z]{2,}$/i, '');

    return url;
}