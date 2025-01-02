const { Router } = require("express");

const auth = require("../controllers/auth");

const router = new Router();

router.post("/logInWithPassword", auth.logInWithPassword);
router.post("/logInPhoneStepOne", auth.logInPhoneStepOne);
router.post("/logInPhoneStepTwo", auth.logInPhoneStepTwo);

router.post("/resetPasswordStepOne", auth.resetPasswordStepOne);
router.post("/resetPasswordStepTwo", auth.resetPasswordStepTwo);

module.exports = router;