const Certificate = require('../database/models/Certificate'); // مسیر فایل مدل Certificate
const FileManager = require('../class/filemanager');
const fileManager = FileManager.getInstance();

exports.createCertificate = async (req, res, next) => {
    try {
        const certificateData = req.body;
        certificateData.creator = req.user._id;

        // بررسی وجود فایل در درخواست
        if (req.file) {
            // استخراج اطلاعات فایل از req.file
            const { buffer, originalname, mimetype } = req.file;
            const user_id = req.user._id;
            // تعیین مسیر پوشه ذخیره فایل؛ این مسیر می‌تواند بنا به نیاز تغییر کند
            const folderPath = JSON.stringify(["", "certificates", user_id, certificateData.name]);

            // ذخیره فایل با استفاده از fileManager
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
        // دریافت پارامترهای صفحه‌بندی از بدنه درخواست
        const { page, perPage } = req.body;

        // یافتن Certificateها با فیلتر بر اساس creator (در صورت نیاز)
        const certificates = await Certificate.find({ creator: req.user._id })
            .populate("creator") // در صورت نیاز می‌توانید فیلدهای دیگری مانند فایل‌های مرتبط را نیز populate کنید
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        // محاسبه تعداد کل Certificateها برای صفحه‌بندی
        const certificateCount = await Certificate.countDocuments({ creator: req.user._id });

        res.status(200).json({ certificateCount, certificates });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
};





// دریافت یک Certificate بر اساس شناسه (id باید در req.body ارسال شود)
exports.getCertificateById = async (req, res, next) => {
    try {
        const { id } = req.body;
        const certificate = await Certificate.findById(id);
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate مورد نظر یافت نشد' });
        }
        res.status(200).json(certificate);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// به‌روزرسانی یک Certificate موجود (id و بقیه فیلدها در req.body ارسال می‌شود)
// در صورتی که عکس تغییر کرده باشد، از form-data استفاده کرده و در req.file پردازش کنید.
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

// حذف یک Certificate (id باید در req.body ارسال شود)
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



