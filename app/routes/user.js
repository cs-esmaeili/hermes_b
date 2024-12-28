const { Router } = require("express");

const user = require("../controllers/user");

const router = new Router();

router.post("/registerPure", user.registerPure);
router.post("/updateRegisterPure", user.updateRegisterPure);
router.post("/userList", user.userList);
router.post("/userInformation", user.userInformation);
router.post("/searchUser", user.searchUser);
router.post("/buyProducts", user.buyProducts);
router.post("/sellProducts", user.sellProducts);
router.post("/boxProducts", user.boxProducts);
router.post("/sellBoxProducts", user.sellBoxProducts);
router.post("/securityCheck", user.securityCheck);

module.exports = router;