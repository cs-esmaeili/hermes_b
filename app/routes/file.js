const { Router } = require("express");

const fileController = require("../controllers/file");

const router = new Router();

// File routes
router.post('/uploadFile', fileController.uploadFile);
router.post('/deleteFile', fileController.deleteFile);
router.post('/renameFile', fileController.renameFile);
router.post('/renameFolder', fileController.renameFolder);
router.post('/createFolder', fileController.createFolder);
router.post('/deleteFolder', fileController.deleteFolder);
router.post('/listFiles', fileController.listFiles);

module.exports = router;