const { Router } = require("express");

const smsTemplate = require("../controllers/smsTemplate");

const router = new Router();

router.post("/createSmsTemplate", smsTemplate.createSmsTemplate);
router.post("/deleteSmsTemplate", smsTemplate.deleteSmsTemplate);
router.post("/SmsTemplateList", smsTemplate.SmsTemplateList);
router.post("/sendSmsToUser", smsTemplate.sendSmsToUser);
router.post("/cancelSendSmsToUser", smsTemplate.cancelSendSmsToUser);

module.exports = router;