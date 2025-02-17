const express = require("express");
const router = express.Router();
const examController = require("../controllers/exam");

router.post("/createExam", examController.createExam);
router.post("/getExams", examController.getExams);
router.post("/getExamById", examController.getExamById);
router.post("/updateExam", examController.updateExam);
router.post("/deleteExam", examController.deleteExam);

module.exports = router;
