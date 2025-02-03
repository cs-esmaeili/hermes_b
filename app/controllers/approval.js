const Approval = require('../database/models/Approval');
const mongoose = require('mongoose');

exports.createApproval = async (title, model, user_id, field_id, draft, comment) => {
    try {
        const Model = mongoose.model(model);

        delete draft._id
        const approval = await Approval.findOneAndUpdate(
            { model, field_id },
            {
                user_id,
                title,
                field_id,
                model,
                comment,
                status: "pending",
                draft,
            },
            { new: true, upsert: true }
        );
        await Model.updateOne(
            { _id: field_id },
            {
                $set: {
                    'approval_id': approval._id,
                }
            }
        );
        return approval;
    } catch (error) {
        console.error("Error Create approval:", error);
        throw error;
    }
};


exports.getApprovals = async (req, res, next) => {
    try {

        const { page, perPage } = req.body;
        let approvals = await Approval.find({})
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const approvalsCount = await Approval.countDocuments({});
        res.send({ approvalsCount, approvals });
    } catch (err) {
        console.log(err);

        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};

exports.acceptApproval = async (req, res, next) => {
    try {
        const { approval_id } = req.body;

        let approval = await Approval.findById(approval_id).lean();
        if (!approval) {
            return res.status(404).send({ message: "Approval not found" });
        }

        const { model, field_id, draft } = approval;
        const Model = mongoose.model(model);

        if (approval.status)
            approval.draft.status = "live";


        const updateResult = await Model.updateMany({ _id: field_id }, { $set: draft });

        if (updateResult.modifiedCount === 0) {
            return res.status(404).send({ message: "Approval ID not found in target model" });
        }

        await Approval.findByIdAndRemove(approval_id);

        res.send({ message: "Approval accepted successfully" });
    } catch (error) {
        console.error("Error processing approval:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};


exports.rejectApproval = async (req, res, next) => {
    try {
        const { approval_id, comment } = req.body;

        if (!approval_id) {
            return res.status(400).send({ message: "Approval ID is required" });
        }

        const approval = await Approval.findOneAndUpdate(
            { _id: approval_id },
            { status: "rejected", comment: comment },
            { new: true }
        );

        if (!approval) {
            return res.status(404).send({ message: "Approval not found" });
        }

        res.send({ message: "Approval rejected successfully", approval });
    } catch (error) {
        console.error("Error processing approval:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};
