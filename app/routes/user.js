const { Router } = require("express");
const multer = require('multer');
const user = require("../controllers/user");

const router = new Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});


router.post("/userList", user.userList);
router.post("/userInformation", user.userInformation);
router.post("/securityCheck", user.securityCheck);
router.post("/createUser", user.createUser);
router.post("/updateUserData", user.updateUserData);
router.post('/changeAvatar', upload.single('file'), user.changeAvatar);
module.exports = router;