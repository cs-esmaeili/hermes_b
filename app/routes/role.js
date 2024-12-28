const { Router } = require("express");

const role = require("../controllers/role");

const router = new Router();

router.post("/roleList", role.roleList);
router.post("/createRole", role.createRole);
router.post("/deleteRole", role.deleteRole);
router.post("/updateRole", role.updateRole);

module.exports = router;