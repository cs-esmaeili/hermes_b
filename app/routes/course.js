const { Router } = require("express");

const course = require("../controllers/course");

const router = new Router();

router.post("/addCourse", course.addCourse);
router.post("/editCourse", course.editCourse);
router.post("/courseList", course.courseList);
router.post("/courseInformation", course.courseInformation);
router.post("/addTopic", course.addTopic);
router.post("/deleteTopic", course.deleteTopic);
router.post("/editTopic", course.editTopic);

module.exports = router;