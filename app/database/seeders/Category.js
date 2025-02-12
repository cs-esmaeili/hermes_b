const Category = require("../models/Category");
const { green, red } = require("colors");

const seqNumber = 4;

const seed = async () => {
    try {
        await Category.deleteMany(); 

        const rootCategories = [];
        const allCategories = [];


        for (let i = 1; i <= 3; i++) {
            const rootCategory = await Category.create({ name: `Category ${i}`, parent: null });
            rootCategories.push(rootCategory);
        }

        for (const root of rootCategories) {
            for (let j = 1; j <= 3; j++) {
                const subCategory1 = new Category({ name: `${root.name} - Sub ${j}`, parent: root._id });
                allCategories.push(subCategory1);
            }
        }

        await Category.insertMany(allCategories);

    } catch (error) {
        console.error(red("❌ خطا در اجرای Seeder:"), error);
    }

    console.log(`${red(seqNumber)} : ${green("Category seeder done")}`);
};

module.exports = { seqNumber, seed };
