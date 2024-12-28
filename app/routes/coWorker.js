const { Router } = require("express");

const executeTrade = require("../controllers/coWorker");

const router = new Router();

router.post("/executeTrade", executeTrade.executeTrade);

module.exports = router;