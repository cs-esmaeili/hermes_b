const { Router } = require("express");
const multer = require('multer');
const fileController = require("../controllers/file");

const router = new Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});


// File routes
router.post('/uploadFile', upload.single('file'), fileController.uploadFile);
router.post('/deleteFile', fileController.deleteFile);
router.post('/rename', fileController.rename);
router.post('/createFolder', fileController.createFolder);
router.post('/deleteFolder', fileController.deleteFolder);

// Folder routes
router.get('/listFiles/:folderPath(*)?', fileController.listFiles);


module.exports = router;