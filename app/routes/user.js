const { Router } = require("express");
const user = require("../controllers/user");

const router = new Router();

router.post("/userList", user.userList);
router.post("/userInformation", user.userInformation);
router.post("/securityCheck", user.securityCheck);
router.post("/createUser", user.createUser);
router.post("/updateUserData", user.updateUserData);
router.post('/changeAvatar', user.changeAvatar);

module.exports = router;