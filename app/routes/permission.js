const { Router } = require("express");

const permission = require("../controllers/permission");

const router = new Router();

router.post("/togglePermission", permission.togglePermission);

module.exports = router;