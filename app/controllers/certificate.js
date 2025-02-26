const Certificate = require('../database/models/Certificate'); // مسیر فایل مدل Certificate
const FileManager = require('../class/filemanager');
const fileManager = FileManager.getInstance();

exports.createCertificate = async (req, res, next) => {
    try {
        const certificateData = req.body;
        certificateData.creator = req.user._id;

        if (req.file) {
            const { buffer, originalname, mimetype } = req.file;
            const user_id = req.user._id;
            const folderPath = JSON.stringify(["", "certificates", user_id, certificateData.name]);

            const uploadedFile = await fileManager.saveFile(buffer, {
                uploaderId: user_id,
                originalName: originalname,
                mimeType: mimetype,
                isPrivate: false,
                folderPath: folderPath,
            });

            const fileUrl = await fileManager.getPublicFileUrl(uploadedFile[0]._id);
            const filePath = await fileManager.getFilePath(uploadedFile[0]._id, user_id, false);
            const blurHash = "s";

            certificateData.user = certificateData || {};
            certificateData.user.image = {
                url: fileUrl,
                blurHash: blurHash
            };
        }
        const newCertificate = await Certificate.create(certificateData);
        res.status(201).json({ message: "مدرک ایجاد شد" });
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
    }
};


exports.getAllCertificates = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        const user_id = req.user._id;


        const hasPermission = await userHavePermission(user_id, "examSessions.getExamSessions.others");
        let searchQuery = { user_id };
        if (hasPermission) {
            searchQuery = {};
        }
        
        const certificates = await Certificate.find({ creator: req.user._id })
            .populate("creator")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const certificateCount = await Certificate.countDocuments({ creator: req.user._id });

        res.status(200).json({ certificateCount, certificates });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};


exports.getCertificateById = async (req, res, next) => {
    try {
        const { id } = req.body;
        const certificate = await Certificate.findById(id).populate("cert_template_id").lean();
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate مورد نظر یافت نشد' });
        }
        res.status(200).json(certificate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCertificate = async (req, res, next) => {
    try {
        const { id, ...updateData } = req.body;

        if (req.file) {
            updateData.user = updateData.user || {};
            updateData.user.image = {
                url: req.file.path,
                blurHash: req.body.blurHash || ''
            };
        }
        const updatedCertificate = await Certificate.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        if (!updatedCertificate) {
            return res.status(404).json({ error: 'Certificate مورد نظر یافت نشد' });
        }
        res.status(200).json(updatedCertificate);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteCertificate = async (req, res, next) => {
    try {
        const { id } = req.body;
        const deletedCertificate = await Certificate.findByIdAndDelete(id);
        if (!deletedCertificate) {
            return res.status(404).json({ error: 'Certificate مورد نظر یافت نشد' });
        }
        res.status(200).json({ message: 'Certificate با موفقیت حذف شد' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



