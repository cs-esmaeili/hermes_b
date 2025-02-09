const Category = require("../models/Category");
const { green, red } = require("colors");

const seqNumber = 4;

const seed = async () => {
    try {
        await Category.deleteMany(); // حذف دسته‌بندی‌های قبلی برای جلوگیری از داده‌های تکراری

        const rootCategories = [];
        const allCategories = [];

        // 📌 ایجاد 3 دسته‌بندی اصلی (ریشه)
        for (let i = 1; i <= 3; i++) {
            const rootCategory = await Category.create({ name: `Category ${i}`, parent: null });
            rootCategories.push(rootCategory);
        }

        // 📌 ایجاد 3 سطح زیرمجموعه (هر سطح 3 دسته دارد)
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

    console.log(`${red(seqNumber)} : ${green("Seeder اجرا شد.")}`);
};

module.exports = { seqNumber, seed };
