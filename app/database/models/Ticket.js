const mongoose = require('mongoose');
const { buildSchema } = require("./builder");
const { Schema } = mongoose;

const CommentSchema = buildSchema(
    {
        comment: {
            type: String,
            required: true,
        },
        from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
);

const TicketSchema = buildSchema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'answer', 'closed'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
        comments: [
            {
                type: CommentSchema,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema, 'Ticket');
