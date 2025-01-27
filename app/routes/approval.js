const { Router } = require("express");

const approval = require("../controllers/approval");

const router = new Router();

router.post("/approvalList", approval.approvalList);

module.exports = router;