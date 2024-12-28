const Factor = require('../database/models/Factor');

exports.factorListUser = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let factors = await Factor.find({ user_id: req.user._id }).populate({
            path: 'products.product_id',
            model: 'Product'
        }).skip((page - 1) * perPage).limit(perPage).lean();

        const factorsCount = await Factor.countDocuments({});
        res.send({ factorsCount, factors });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 500).json(err);
    }
}

exports.changeFactorStatus = async (req, res, next) => {
    try {
        const { factor_id, status } = req.body;
        
        let result = await Factor.updateOne({ _id: factor_id }, { type: status });

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "فاکتور یافت نشد" });
        }

        res.status(200).json({ message: "فاکتور بروز شد" });
        
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).json(err);
    }
}
