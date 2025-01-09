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


router.delete('/deleteFile/:fileId', fileController.deleteFile);
router.put('/renameFile/:fileId', fileController.renameFile);

// Folder routes
router.post('/createFolder', fileController.createFolder);
router.delete('/deleteFolder/:folderPath(*)', fileController.deleteFolder);
router.get('/listFiles/:folderPath(*)?', fileController.listFiles);


module.exports = router;