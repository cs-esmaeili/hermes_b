// certificateTemplateController.js
const CertificateTemplate = require('../database/models/CertificateTemplate');

// Create a new certificate template
async function createCertificateTemplate(req, res) {
    try {
        // Destructure name from the request body
        const { name } = req.body;
        // Create a new instance of CertificateTemplate
        const newTemplate = new CertificateTemplate({ name });
        // Save the new certificate template to the database
        const savedTemplate = await newTemplate.save();
        res.status(201).json(savedTemplate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get all certificate templates
async function getCertificateTemplates(req, res) {
    try {
        const templates = await CertificateTemplate.find();
        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get a certificate template by its ID
async function getCertificateTemplateById(req, res) {
    try {
        const template = await CertificateTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update a certificate template
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
        res.status(500).json({ message: error.message });
    }
}

// Delete a certificate template
async function deleteCertificateTemplate(req, res) {
    try {
        const deletedTemplate = await CertificateTemplate.findByIdAndDelete(req.params.id);
        if (!deletedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    createCertificateTemplate,
    getCertificateTemplates,
    getCertificateTemplateById,
    updateCertificateTemplate,
    deleteCertificateTemplate,
};
