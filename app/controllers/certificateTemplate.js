const CertificateTemplate = require('../database/models/CertificateTemplate');
const errorHandler = require("../utils/errorHandler");


async function createCertificateTemplate(req, res) {
    try {
        const { name } = req.body;
        const newTemplate = new CertificateTemplate({ name });
        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        errorHandler(null, error, "certificateTemplate", "createCertificateTemplate");
    }
}

async function getCertificateTemplates(req, res) {
    try {
        const templates = await CertificateTemplate.find();
        res.json(templates);
    } catch (error) {
        errorHandler(null, error, "certificateTemplate", "getCertificateTemplates");
    }
}

async function getCertificateTemplateById(req, res) {
    try {
        const template = await CertificateTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        errorHandler(null, error, "certificateTemplate", "getCertificateTemplateById");
    }
}

async function updateCertificateTemplate(req, res) {
    try {
        const updatedTemplate = await CertificateTemplate.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(updatedTemplate);
    } catch (error) {
        errorHandler(null, error, "certificateTemplate", "updateCertificateTemplate");
    }
}

async function deleteCertificateTemplate(req, res) {
    try {
        const deletedTemplate = await CertificateTemplate.findByIdAndDelete(req.params.id);
        if (!deletedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        errorHandler(null, error, "deleteCertificateTemplate", "updateCertificateTemplate");
    }
}

module.exports = {
    createCertificateTemplate,
    getCertificateTemplates,
    getCertificateTemplateById,
    updateCertificateTemplate,
    deleteCertificateTemplate,
};
