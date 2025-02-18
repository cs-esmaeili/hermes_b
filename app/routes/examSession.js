const { Router } = require("express");

const examSession = require("../controllers/examSession");

const router = new Router();

router.post("/startExam", examSession.startExam);

module.exports = router;