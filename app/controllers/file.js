const { error } = require('console');
const FileManager = require('../class/filemanager');
const { checkUserAccess, getUserFromToken } = require("../utils/user")

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
        const { folderPath, isPrivate } = req.body;
        const userId = req.user._id;

        const files = await fileManager.folderFileList(folderPath, userId, isPrivate, true);

        res.json({ files });
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
        next(error);
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
        next(error);
    }
};

exports.downloadFile = async (req, res, next) => {
    try {
        const { file_id, token } = req.params;

        if (token) {
            const check = await checkUserAccess(token, "/file/listFiles");
            const user = await getUserFromToken(token);
            const file = await fileManager.getFileUrl(file_id, user._id, check);
            res.sendFile(file);
        } else {
            //public
            const file = await fileManager.getFileUrl(file_id, user_id, false);
            res.sendFile(file);
        }
    } catch (error) {
        console.log(error);
        res.status(error.statusCode || 500).json(error.message);
    }
}