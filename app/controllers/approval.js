const Approval = require('../database/models/Approval');
const mongoose = require('mongoose');

exports.createApproval = async (title, model, user_id, orginalData, comment) => {
    try {
        const Model = mongoose.model(model);

        const approval = await Approval.findOneAndUpdate(
            { model, user_id },
            {
                ...orginalData,
                approval_title: title,
                approval_comment: comment,
                approval_status: "pending"
            },
            { new: true, upsert: true }
        );


        await Model.updateOne(
            { _id: orginalData._id },
            {
                $set: {
                    'approval_id': approval._id,
                }
            }
        );
        return approval;
    } catch (error) {
        console.error("Error processing approval:", error);
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

        const { model } = approval;
        const Model = mongoose.model(model);

        approval.approval_id = null;
        if (approval.status)
            approval.status = "live";


        const updateResult = await Model.updateMany({ _id: approval._id }, { $set: approval });

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
            { approval_status: "rejected", approval_comment: comment },
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
