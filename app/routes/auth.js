const { Router } = require("express");

const auth = require("../controllers/auth");

const router = new Router();

router.post("/createOrLoginWithPassword", auth.createOrLoginWithPassword);
router.post("/logInPhoneStepOne", auth.logInPhoneStepOne);
router.post("/logInPhoneStepTwo", auth.logInPhoneStepTwo);

module.exports = router;