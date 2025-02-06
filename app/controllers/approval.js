const Approval = require('../database/models/Approval');
const mongoose = require('mongoose');
const { currentTime } = require("../utils/TimeConverter");

exports.createApproval = async (title, model, user_id, field_id, draft, comment) => {
    try {
        const Model = mongoose.model(model);

        if (draft)
            delete draft.approval_id;

        let approval = await Approval.findOne({ model, field_id });

        if (!approval) {
            approval = await Approval.create({
                model,
                field_id,
                user_id,
                approval_title: title,
                approval_comment: comment,
                approval_status: "pending",
                [model]: draft
            });
        } else {
            await Approval.updateOne(
                { model, field_id },
                {
                    approval_title: title,
                    approval_comment: comment,
                    approval_status: "pending",
                }
            );
        }

        await Model.updateOne(
            { _id: field_id },
            {
                $set: {
                    approval_id: approval._id,
                    status: "pending"
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

        const { model, field_id } = approval;
        const Model = mongoose.model(model);

        approval[model].status = "live";

        const updateResult = await Model.updateMany(
            { _id: field_id },
            { $set: approval[model] }
        );

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


        const update = await Approval.findOneAndUpdate(
            { _id: approval_id },
            { $set: { "approval_status": "rejected", "approval_comment": comment } },
            { new: true }
        );

        if (!update) {
            return res.status(404).send({ message: "Approval not found" });
        }

        res.send({ message: "Approval rejected successfully", update });
    } catch (error) {
        console.error("Error processing approval:", error);
        res.status(500).send({ message: "Internal Server Error" });
    }
};
