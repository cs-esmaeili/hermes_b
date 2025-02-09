const { Router } = require("express");

const ticket = require("../controllers/ticket");

const router = new Router();

router.post("/createTicket", ticket.createTicket);

module.exports = router;