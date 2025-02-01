const { Router } = require("express");

const course = require("../controllers/course");

const router = new Router();

router.post("/addCourse", course.addCourse);
router.post("/getCourse", course.getCourse);

module.exports = router;