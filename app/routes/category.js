const { Router } = require("express");

const category = require("../controllers/category");

const router = new Router();

router.post("/createCategory", category.createCategory);
router.post("/deleteCategory", category.deleteCategory);
router.post("/updateCategory", category.updateCategory);
router.post("/categoryList", category.categoryList);

module.exports = router;