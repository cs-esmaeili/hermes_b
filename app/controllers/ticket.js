const Ticket = require('../database/models/Ticket');

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
        next(error);
    }
};


exports.adminGetTicketById = async (req, res, next) => {
    try {

        const { ticket_id } = req.body;

        const ticket = await Ticket.findOne({ _id: ticket_id })
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
        next(error);
    }
};

exports.getTicketById = async (req, res, next) => {
    try {
        const { ticket_id } = req.body;

        const ticket = await Ticket.findOne({ _id: ticket_id, from: req.user._id })
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
        next(error);
    }
};

exports.getTickets = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        let tickets = await Ticket.find({ from: req.user._id })
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
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};


exports.adminGetTickets = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;

        let tickets = await Ticket.find({})
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
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};


exports.adminUpdateTicket = async (req, res, next) => {
    try {
        const { ticket_id, comment, status } = req.body;

        const ticket = await Ticket.findById(ticket_id);
        if (!ticket) {
            return res.status(404).json({ message: "تیکت مورد نظر یافت نشد." });
        }

        if (comment) {
            ticket.comments.push({ comment, from: req.user._id });
        }

        if (status) {
            ticket.status = status;
        }

        await ticket.save();

        return res.status(200).json({
            message: "تیکت با موفقیت به‌روزرسانی شد.",
            ticket,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateTicket = async (req, res, next) => {
    try {
        const { ticket_id, comment } = req.body;


        const ticket = await Ticket.findOne({ _id: ticket_id, from: req.user._id, });

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
        next(error);
    }
};
