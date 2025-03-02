const Ticket = require('../database/models/Ticket');
const { userHavePermission } = require('../utils/user');
const errorHandler = require("../utils/errorHandler");

exports.createTicket = async (req, res, next) => {
    try {
        const { subject, comment, priority, to = null } = req.body;

        const newTicket = new Ticket({
            subject,
            priority: priority || 'medium',
            from: req.user._id,
            to,
            comments: [
                {
                    comment,
                    from: req.user._id,
                },
            ],
        });

        await newTicket.save();

        return res.status(201).json({
            message: 'Ticket created successfully',
            ticket: newTicket,
        });
    } catch (error) {
        errorHandler(res, error, "ticket", "createTicket");
    }
};



exports.getTicketById = async (req, res, next) => {
    try {
        const { ticket_id } = req.body;

        const check = await userHavePermission(req.user._id, "getTicketById.others");


        let searchQuery = { _id: ticket_id }
        if (check) searchQuery = { _id: ticket_id, from: req.user._id }

        const ticket = await Ticket.findOne(searchQuery)
            .populate('from')
            .populate('comments.from');

        if (!ticket) {
            return res.status(404).json({ message: 'تیکت مورد نظر یافت نشد.' });
        }

        if (ticket.comments && Array.isArray(ticket.comments)) {
            ticket.comments = ticket.comments.reverse();
        }

        return res.status(200).json(ticket);
    } catch (error) {
        errorHandler(res, error, "ticket", "getTicketById");
    }
};

exports.getTickets = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        const check = await userHavePermission(req.user._id, "ticket.getTickets.others");

        let searchQuery = { from: req.user._id }
        if (check) searchQuery = {}

        let tickets = await Ticket.find(searchQuery)
            .sort({ createdAt: -1 })
            .populate({
                path: 'from',
                populate: { path: 'role_id' }
            })
            .populate({
                path: 'comments.from',
                populate: { path: 'role_id' }
            })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        tickets = tickets.map(ticket => {
            if (ticket.comments && Array.isArray(ticket.comments)) {
                ticket.comments = ticket.comments.reverse();
            }
            return ticket;
        });

        const ticketsCount = await Ticket.countDocuments({});
        res.send({ ticketsCount, tickets });
    } catch (error) {
        errorHandler(res, error, "ticket", "getTickets");
    }
};


exports.updateTicket = async (req, res, next) => {
    try {
        const { ticket_id, comment } = req.body;


        const check = await userHavePermission(req.user._id, "ticket.updateTicket.others");

        let searchQuery = { _id: ticket_id, from: req.user._id, }
        if (check) searchQuery = { _id: ticket_id }

        const ticket = await Ticket.findOne(searchQuery);

        if (!ticket) {
            return res.status(404).json({ message: "تیکت مورد نظر یافت نشد." });
        }

        if (comment) {
            ticket.comments.push({ comment, from: req.user._id, status: 'pending' });
        }

        await ticket.save();

        return res.status(200).json({
            message: "تیکت با موفقیت به‌روزرسانی شد.",
            ticket,
        });
    } catch (error) {
        errorHandler(res, error, "ticket", "updateTicket");
    }
};
