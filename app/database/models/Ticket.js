const mongoose = require('mongoose');
const { buildSchema } = require("./builder");
const { Schema } = mongoose;

const CommentSchema = buildSchema(
    {
        comment: {
            type: String,
            required: true,
        },
        user_id: {
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
            enum: ['open', 'pending', 'closed'],
            default: 'open'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        comments: [
            {
                type: CommentSchema,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
