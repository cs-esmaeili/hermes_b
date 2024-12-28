const { Router } = require("express");

const smsHistory = require("../controllers/smsHistory");

const router = new Router();

router.post("/smsHistoryList", smsHistory.smsHistoryList);
// router.post("/deleteSmsHistory", smsHistory.deleteSmsHistory);

module.exports = router;