const { Router } = require("express");

const certificateTemplate = require("../controllers/certificateTemplate");

const router = new Router();

router.post("/getCertificateTemplates", certificateTemplate.getCertificateTemplates);


module.exports = router;