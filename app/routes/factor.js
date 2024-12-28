const { Router } = require("express");

const factor = require("../controllers/factor");

const router = new Router();

router.post("/factorListUser", factor.factorListUser);
router.post("/changeFactorStatus", factor.changeFactorStatus);

module.exports = router;