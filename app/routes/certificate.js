const { Router } = require("express");
const certificate = require("../controllers/certificate");

const router = new Router();

router.post("/createCertificate", certificate.createCertificate);
router.post("/deleteCertificate", certificate.deleteCertificate);
router.post("/getAllCertificates", certificate.getAllCertificates);
router.post("/getCertificateById", certificate.getCertificateById);
router.post("/updateCertificate", certificate.updateCertificate);

module.exports = router;