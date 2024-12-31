const { Router } = require("express");

const auth = require("../controllers/auth");

const router = new Router();

router.post("/createUserWithPassword", auth.createUserWithPassword);
router.post("/logInWithPassword", auth.logInWithPassword);
router.post("/logInPhoneStepOne", auth.logInPhoneStepOne);
router.post("/logInPhoneStepTwo", auth.logInPhoneStepTwo);

module.exports = router;