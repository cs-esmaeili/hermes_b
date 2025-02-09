const Ticket = require('../database/models/Ticket');

exports.createTicket = async (req, res, next) => {
    try {
        const { subject, comment, priority } = req.body;

        const newTicket = new Ticket({
            subject,
            priority: priority || 'medium',
            comments: [
                {
                    comment,
                    user_id: req.user._id,
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

/**
 * دریافت یک تیکت بر اساس شناسه
 * فرض بر این است که شناسه تیکت از طریق req.params.ticketId ارسال می‌شود.
 */
exports.getTicketById = async (req, res, next) => {
    try {
        const ticketId = req.params.ticketId;
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        return res.status(200).json(ticket);
    } catch (error) {
        next(error);
    }
};

/**
 * به‌روزرسانی تیکت (مثلاً تغییر وضعیت، اولویت یا عنوان)
 * فرض بر این است که شناسه تیکت از طریق req.params.ticketId ارسال شده و فیلدهای به‌روزرسانی در req.body موجود است.
 */
exports.updateTicket = async (req, res, next) => {
    try {
        const ticketId = req.params.ticketId;
        const updateData = req.body;

        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, updateData, { new: true });

        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        return res.status(200).json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * افزودن یک کامنت جدید به تیکت موجود
 * فرض بر این است که شناسه تیکت از طریق req.params.ticketId و اطلاعات کامنت (comment, createdBy) در req.body قرار دارد.
 */
exports.addCommentToTicket = async (req, res, next) => {
    try {
        const ticketId = req.params.ticketId;
        const { comment, createdBy } = req.body;

        const ticket = await Ticket.findById(ticketId);

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // افزودن کامنت جدید به آرایه‌ی کامنت‌ها
        ticket.comments.push({ comment, createdBy });
        await ticket.save();

        return res.status(200).json({
            message: 'Comment added successfully',
            ticket,
        });
    } catch (error) {
        next(error);
    }
};
