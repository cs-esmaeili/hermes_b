const express = require("express");
const router = express.Router();

const questionController = require("../controllers/question");

router.post("/createQuestion", questionController.createQuestion);
router.post("/getQuestions", questionController.getQuestions);
router.post("/updateQuestion", questionController.updateQuestion);
router.post("/deleteQuestion", questionController.deleteQuestion);

module.exports = router;
