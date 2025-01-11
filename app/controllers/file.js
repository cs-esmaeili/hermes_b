const FileManager = require('../class/filemanager');
const path = require('path');

const fileManager = FileManager.getInstance();

exports.uploadFile = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        const { isPrivate = false, folderPath = '', metadata = {} } = req.body;


        const file = await fileManager.saveFile(req.file.buffer, {
            uploaderId: req.user._id,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            isPrivate: isPrivate === 'true' || isPrivate === true,
            folderPath,
            metadata: typeof metadata === 'string' ? JSON.parse(metadata) : metadata
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            file
        });

    } catch (error) {
        console.log("Error in File upload : " + error);
    }
};

exports.deleteFile = async (req, res, next) => {
    try {
        const { file_id } = req.body;
        const userId = req.user._id;

        await fileManager.deleteFile(file_id, userId, true);

        res.json({
            message: 'File deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteFolder = async (req, res, next) => {
    try {
        const { folderPath, isPrivate } = req.body;
        const userId = req.user._id;

        await fileManager.deleteFolder(folderPath, userId, isPrivate, true);

        res.json({
            message: 'Folder deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.listFiles = async (req, res, next) => {
    try {
        const { folderPath = '', isPrivate } = req.body;
        const userId = req.user._id;

        const files = await fileManager.folderFileList(folderPath, userId, isPrivate, true);

        res.json({
            files
        });
    } catch (error) {
        next(error);
    }
};

exports.createFolder = async (req, res, next) => {
    try {
        const { folderPath, isPrivate } = req.body;

        if (!folderPath) {
            return res.status(400).json({ message: 'Folder path is required' });
        }

        await fileManager.createFolder(folderPath, isPrivate);

        res.status(201).json({
            message: 'Folder created successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.rename = async (req, res, next) => {
    try {
        const { file_id, newName } = req.body;
        const userId = req.user._id;

        if (!newName) {
            return res.status(400).json({ message: 'New name is required' });
        }

        const file = await fileManager.rename(file_id, newName, userId, true);

        res.json({
            message: 'File renamed successfully',
            file
        });
    } catch (error) {
        next(error);
    }
};