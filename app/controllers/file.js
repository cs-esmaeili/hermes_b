const FileManager = require('../class/filemanager');
const { checkUserAccess, getUserFromToken } = require("../utils/user");
const File = require("../database/models/File");
const fileManager = FileManager.getInstance();
const errorHandler = require("../utils/errorHandler");

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
        errorHandler(res, error, "file", "uploadFile");
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
        errorHandler(res, error, "file", "deleteFile");
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
        errorHandler(res, error, "file", "deleteFolder");
    }
};

exports.listFiles = async (req, res, next) => {
    try {
        const { folderPath, isPrivate } = req.body;
        const userId = req.user._id;

        const files = await fileManager.folderFileList(folderPath, userId, isPrivate, true);

        res.json({ files });
    } catch (error) {
        errorHandler(res, error, "file", "listFiles");
    }
};

exports.createFolder = async (req, res, next) => {
    try {
        const { folderName, folderPath, isPrivate } = req.body;

        if (!folderPath) {
            return res.status(400).json({ message: 'Folder path is required' });
        }

        await fileManager.createFolder(folderName, folderPath, isPrivate);

        res.status(201).json({
            message: 'Folder created successfully'
        });
    } catch (error) {
        errorHandler(res, error, "file", "createFolder");
    }
};

exports.renameFile = async (req, res, next) => {
    try {
        const { file_id, newName } = req.body;
        const userId = req.user._id;

        if (!newName) {
            return res.status(400).json({ message: 'New name is required' });
        }

        const file = await fileManager.renameFile(file_id, newName, userId, true);

        res.json({
            message: 'File renamed successfully',
            file
        });
    } catch (error) {
        errorHandler(res, error, "file", "renameFile");
    }
};
exports.renameFolder = async (req, res, next) => {
    try {
        const { oldFolderPath, newFolderPath, isPrivate = false } = req.body;
        const userId = req.user._id;

        if (!newFolderPath) {
            return res.status(400).json({ message: 'newFolderPath is required' });
        }

        const file = await fileManager.renameFolder(oldFolderPath, newFolderPath, isPrivate, userId, true);

        res.json({
            message: 'File renamed successfully',
            file
        });
    } catch (error) {
        errorHandler(res, error, "file", "renameFolder");
    }
};

exports.downloadFile = async (req, res, next) => {
    try {
        const { file_id, token } = req.params;
        const file = await File.findById(file_id);

        if (token && file?.isPrivate) {
            const check = await checkUserAccess(token, "/dashboard/filemanager");
            const user = await getUserFromToken(token);
            const file = await fileManager.getFilePath(file_id, user._id, check);
            res.sendFile(file);
        } else {
            const file = await fileManager.getFilePath(file_id, null, false);
            res.sendFile(file);
        }
    } catch (error) {
        errorHandler(res, error, "file", "downloadFile");
    }
}