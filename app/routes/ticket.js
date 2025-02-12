const { Router } = require("express");

const ticket = require("../controllers/ticket");

const router = new Router();

router.post("/createTicket", ticket.createTicket);

router.post("/adminGetTicketById", ticket.adminGetTicketById);
router.post("/adminGetTickets", ticket.adminGetTickets);
router.post("/adminUpdateTicket", ticket.adminUpdateTicket);

router.post("/getTicketById", ticket.getTicketById);
router.post("/getTickets", ticket.getTickets);
router.post("/updateTicket", ticket.updateTicket);

module.exports = router;