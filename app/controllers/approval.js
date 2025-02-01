const Approval = require('../database/models/Approval');
const mongoose = require('mongoose');

exports.createApproval = async (title, model, field, user_id, comment) => {
    try {
        const approval = await Approval.findOneAndUpdate(
            { model, field, user_id },
            { title, comment, status: "pending" },
            { new: true, upsert: true }
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
        const approval = await Approval.findById(approval_id);

        if (!approval) {
            console.log("Approval not found");
            return null;
        }

        const { model, field } = approval;
        const Model = mongoose.model(model);

        await Model.updateOne({ approval_id }, { approval_id: null });

        await Approval.findByIdAndRemove(approval_id);

        res.send({ message: 'Approval Accepted successfully' });
    } catch (error) {
        console.error("Error processing approval:", error);
        throw error;
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
            { status: "rejected", comment },
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
