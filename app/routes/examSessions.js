const { Router } = require("express");

const examSession = require("../controllers/examSessions");

const router = new Router();

router.post("/startExam", examSession.startExam);
router.post("/getActiveExamSession", examSession.getActiveExamSession);
router.post("/updateQustionAnswer", examSession.updateQustionAnswer);

module.exports = router;