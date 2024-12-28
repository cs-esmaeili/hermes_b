const path = require('path');
const fs = require('fs');
const BaseFileDir = path.join(process.cwd(), ...JSON.parse(process.env.STORAGE_LOCATION));
const { v4: uuidv4 } = require('uuid');
const { transaction } = require('../database');
const { mSaveFile, mDeleteFile, mDeleteFolder, mFolderFileList, mCreateFolder, mRenameFolder, mRenameFile } = require('../static/response.json');
const { getFilesFromFolder } = require('../utils/file');

exports.saveFile = async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    const { location } = req.body;
    const fileList = req.files['files[]'];
    const result = await transaction(async () => {
        const saveFileandData = async (uploadedFile) => {
            let saveFileLocation = path.join(BaseFileDir, ...JSON.parse(location));;
            const newFileName = uuidv4() + path.extname(uploadedFile.name);
            fs.mkdirSync(saveFileLocation, { recursive: true });
            uploadedFile.mv(path.join(saveFileLocation, newFileName));
        }
        if (typeof fileList === 'object' && fileList !== null && !Array.isArray(fileList)) {
            await saveFileandData(fileList);
        } else {
            for (const fileKey in fileList) {
                const uploadedFile = fileList[fileKey];
                await saveFileandData(uploadedFile);
            }
        }
    });
    if (result === true) {
        res.send({ message: mSaveFile.ok });
    } else {
        res.status(result.statusCode || 422).json({ message: mSaveFile.fail });
    }
}

exports.deleteFile = async (req, res, next) => {
    const { location, fileName } = req.body;
    const result = await transaction(async () => {
        const fileLocation = path.join(BaseFileDir, location.join(path.sep), fileName);
        fs.unlinkSync(fileLocation, { recursive: true });
    });
    if (res != null) {
        if (result === true) {
            res.send({ message: mDeleteFile.ok });
        } else {
            res.status(result.statusCode || 422).json({ message: mDeleteFile.fail });
        }
    } else {
        return (true);
    }
}

exports.deleteFolder = async (req, res, next) => {
    const { location } = req.body;
    try {
        const folderLocation = path.join(BaseFileDir, ...location);
        const files = fs.readdirSync(folderLocation, { recursive: true });

        for (const file of files) {
            fs.unlinkSync(folderLocation + path.sep + file, { recursive: true });
        }
        fs.rmSync(folderLocation, { recursive: true });
        res.send({ message: mDeleteFolder.ok });
    } catch (error) {
        res.status(error.statusCode || 422).json({ message: mDeleteFolder.fail });
    }
}


exports.folderFileList = async (req, res, next) => {
    const { location } = req.body;
    try {
        const folderLocation = path.join(BaseFileDir, ...location);
        const files = await getFilesFromFolder(folderLocation);
        const baseUrl = process.env.BASE_URL +
            [JSON.parse(process.env.STORAGE_LOCATION)[2], ...location].join("/") +
            "/";
        res.send({ baseUrl, files });
    } catch (error) {
        res.status(error.statusCode || 422).json({ message: mFolderFileList.fail });
    }
}

exports.createFolder = async (req, res, next) => {
    const { location, folderName } = req.body;
    try {
        const folderLocation = path.join(BaseFileDir, ...location);
        fs.mkdirSync((folderLocation + "/" + folderName), { recursive: true });
        res.send({ message: mCreateFolder.ok });
    } catch (error) {
        res.status(error.statusCode || 422).json({ message: mCreateFolder.fail });
    }
}

exports.rename = async (req, res, next) => {
    const { location, oldName, newName } = req.body;
    const result = await transaction(async () => {
        const oldLocation = path.join(BaseFileDir, location.join(), oldName);
        const newLocation = path.join(BaseFileDir, location.join(), newName);
        if (fs.existsSync(newLocation)) {
            throw new Error();
        }
        fs.renameSync(oldLocation, newLocation, { recursive: true });

    });
    if (result === true) {
        res.send({ message: mRenameFile.ok });
    } else {
        res.status(result.statusCode || 422).json({ message: mRenameFile.fail });
    }
}