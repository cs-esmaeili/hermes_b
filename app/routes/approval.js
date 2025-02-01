const { Router } = require("express");

const approval = require("../controllers/approval");

const router = new Router();

router.post("/approvalList", approval.getApprovals);
router.post("/acceptApproval", approval.acceptApproval);
router.post("/rejectApproval", approval.rejectApproval);


module.exports = router;