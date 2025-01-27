const Approval = require('../database/models/Approval');
const AdminApprovalRoutes = require('../static/AdminApproval.json');
const Permission = require('../database/models/Permission');

exports.addApproval = async (req, res, next) => {
    try {
        const existingApproval = await Approval.findOne({ url: req.originalUrl });

        const permission = await Permission.findOne({ route: req.originalUrl });


        let createApproval;
        if (existingApproval) {
            createApproval = await Approval.findByIdAndUpdate(
                existingApproval._id,
                {
                    urlMeta: { name: permission.name, disc: permission.disc },
                    method: req.method,
                    headers: req.headers,
                    body: req.body,
                    query: req.query,
                    params: req.params,
                    file: req.file,
                    user: req.user,
                    status: "pending"
                },
                { new: true }
            );
        } else {
            createApproval = await Approval.create({
                urlMeta: { name: permission.name, disc: permission.disc },
                user: req.user,
                method: req.method,
                url: req.originalUrl,
                headers: req.headers,
                body: req.body,
                query: req.query,
                params: req.params,
                comment: req.body.comment || '',
                file: req.file,
            });
        }
        res.status(201).json({
            message: 'Request saved successfully',
            approval: createApproval,
        });
    } catch (err) {
        console.error('Error while saving approval:', err);
        res.status(err.statusCode || 500).json({
            message: 'Failed to save approval',
            error: err.message,
        });
    }
};

exports.processApproval = async (req, res, next) => {
    try {
        const { approval_id } = req.body;

        const approval = await Approval.findById(approval_id);
        if (!approval) {
            throw new Error('Approval request not found');
        }
        const { url } = approval;
        const orginalRequest = await approval.toExpressRequest();

        const approvalRoute = AdminApprovalRoutes.find(approval => approval.url.includes(url));
        if (!approvalRoute) {
            throw new Error('Route not found to execute !');
        }

        const module = require(`../controllers/${approvalRoute.moduleName}.js`);
        await module[approvalRoute.method](orginalRequest, res, next);

        await approval.deleteOne();
        return { message: 'Request processed successfully' };
    } catch (err) {
        console.error('Error processing approval:', err);
        throw err;
    }
};

exports.rejectApproval = async (req, res, next) => {
    try {
        const { approval_id, comment } = req.body;

        if (!approval_id) {
            return res.status(400).json({ error: "Approval ID is required." });
        }

        const result = await Approval.updateOne(
            { _id: approval_id },
            { $set: { comment, status: "rejected" } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Approval not found." });
        }

        return res.status(200).json({ message: "Approval rejected successfully." });
    } catch (err) {
        console.error("Error processing approval:", err);
        next(err);
    }
};


exports.approvalList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let approvals = await Approval.find({})
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const approvalsCount = await Approval.countDocuments({});
        res.send({ approvalsCount, approvals });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
}