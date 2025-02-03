const { Router } = require("express");

const course = require("../controllers/course");

const router = new Router();

router.post("/addCourse", course.addCourse);
router.post("/editCourse", course.editCourse);
router.post("/courseList", course.courseList);
router.post("/courseInformation", course.courseInformation);

module.exports = router;