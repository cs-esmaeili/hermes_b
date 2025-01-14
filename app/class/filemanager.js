// src/services/FileManager.js
const fs = require('fs').promises;
const path = require('path');
const { transaction } = require('../database');
const File = require('../database/models/File');
const FileAccess = require('../database/models/FileAccess');

class FileManager {
    constructor() {
        if (FileManager.instance) {
            return FileManager.instance;
        }
        this.initialized = false;
        FileManager.instance = this;
    }

    initialize() {
        if (this.initialized) {
            console.warn('FileManager already initialized');
            return this;
        }

        this.publicBaseDir = path.join(process.cwd(), JSON.parse(process.env.PUBLIC_DIR).join(path.sep));
        this.privateBaseDir = path.join(process.cwd(), JSON.parse(process.env.PRIVATE_DIR).join(path.sep));

        this.File = File;
        this.FileAccess = FileAccess;

        this.#createStorageDirectories();

        this.initialized = true;
        return this;
    }

    async #createStorageDirectories() {
        try {
            await fs.mkdir(this.publicBaseDir, { recursive: true });
            await fs.mkdir(this.privateBaseDir, { recursive: true });
        } catch (error) {
            console.error('Error creating storage directories:', error);
        }
    }

    static getInstance() {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    #checkInitialized() {
        if (!this.initialized) {
            throw new Error('FileManager not initialized. Call initialize() first');
        }
    }

    async createPath(pathSegments) {
        if (typeof pathSegments == "string") {
            pathSegments = JSON.parse(pathSegments);
        }

        if (pathSegments.includes('..')) {
            throw new Error('Invalid folder path');
        }

        if (!Array.isArray(pathSegments) || pathSegments.length === 0) {
            throw new Error('Invalid pathSegments: must be a non-empty array of strings');
        }

        return pathSegments;
    }

    async saveFile(fileBuffer, options) {
        this.#checkInitialized();

        const { uploaderId, originalName, mimeType, isPrivate, metadata = {} } = options;
        let { folderPath = [] } = options;
        folderPath = await this.createPath(folderPath);

        const baseDir = isPrivate ? this.privateBaseDir : this.publicBaseDir;
        const fullFolderPath = path.join(baseDir, ...folderPath);

        await fs.mkdir(fullFolderPath, { recursive: true });

        const uniqueFileName = `${Date.now()}-${originalName}`;
        const fullFilePath = path.join(baseDir, ...folderPath, uniqueFileName);

        await transaction(async (session) => {
            const file = await this.File.create([{
                uploader_id: uploaderId,
                originalName,
                hostName: uniqueFileName,
                storagePath: folderPath,  
                mimeType,
                size: fileBuffer.length,
                isPrivate,
                metadata,
            }]);
            if (isPrivate) {
                await this.FileAccess.create([{
                    file_id: file[0]._id,
                    accessList: [{
                        userId: uploaderId,
                        accessLevel: 'write'
                    }]
                }]);
            }
            await fs.writeFile(fullFilePath, fileBuffer);
            return file;
        });
    }

    async deleteFile(fileId, userId, userIsAdmin = false) {
        this.#checkInitialized();

        const file = await this.File.findById(fileId);
        if (!file) {
            throw new Error('File not found');
        }

        if (file.isPrivate && !userIsAdmin) {
            const access = await this.FileAccess.findOne({
                file_id: fileId,
                user_id: userId,
                accessLevel: 'write'
            });
            if (!access) {
                throw new Error('Access denied');
            }
        }

        const baseDir = file.isPrivate ? this.privateBaseDir : this.publicBaseDir;
        const fullFilePath = path.join(baseDir, ...file.storagePath, file.hostName);
        await transaction(async (session) => {
            await this.File.deleteOne({ _id: fileId });

            if (file.isPrivate) {
                await this.FileAccess.deleteOne({ file_id: fileId });
            }
            await fs.unlink(fullFilePath);
        });
    }

    async deleteFolder(folderPath, userId, isPrivate = false, userIsAdmin) {
        this.#checkInitialized();

        folderPath = await this.createPath(folderPath);

        const files = await this.File.find({
            storagePath: folderPath,
            isPrivate,
        });

        for (const file of files) {
            if (file.isPrivate && !userIsAdmin) {
                const access = await this.FileAccess.findOne({
                    file_id: file._id,
                    user_id: userId,
                    accessLevel: 'write'
                });
                if (!access) {
                    throw new Error('Access denied');
                }
            }
        }

        await transaction(async (session) => {

            const fileIds = files.map(file => file._id);
            for (const file of files) {
                const baseDir = file.isPrivate ? this.privateBaseDir : this.publicBaseDir;
                const fullFilePath = path.join(baseDir, ...file.storagePath, file.hostName);
                await fs.unlink(fullFilePath);
            }

            await this.File.deleteMany({
                _id: { $in: fileIds }
            });

            await this.FileAccess.deleteMany({
                file_id: { $in: fileIds }
            });

            const baseDir = isPrivate ? this.privateBaseDir : this.publicBaseDir;
            await fs.rm(path.join(baseDir, ...folderPath), { recursive: true, force: true });

        });
    }

    async folderFileList(folderPath, userId, isPrivate, userIsAdmin) {
        this.#checkInitialized();

        folderPath = await this.createPath(folderPath);

        const baseDir = isPrivate ? this.privateBaseDir : this.publicBaseDir;
        const fullFolderPath = path.join(baseDir, ...folderPath);

        try {
            const folderExists = await fs.stat(fullFolderPath);
            if (!folderExists.isDirectory()) {
                throw new Error('Path is not a directory');
            }
        } catch (err) {
            throw new Error('Folder does not exist');
        }

        const files = await this.File.find({
            storagePath: folderPath,
            isPrivate,
        });

        const directoryEntries = await fs.readdir(fullFolderPath, { withFileTypes: true });
        const folders = directoryEntries
            .filter(entry => entry.isDirectory())
            .map(folder => ({
                name: folder.name,
                type: 'folder'
            }));

        const result = [];

        for (const file of files) {
            if (!file.isPrivate || userIsAdmin) {
                result.push({ ...file.toObject(), type: 'file' });
            } else {
                const access = await this.FileAccess.findOne({
                    file_id: file._id,
                    user_id: userId,
                    accessLevel: 'read'
                });

                if (access) {
                    result.push({
                        ...file.toObject(),
                        accessLevel: access.accessList.find(
                            a => a.userId.toString() === userId.toString()
                        ).accessLevel,
                        type: 'file'
                    });
                }
            }
        }

        return [...folders, ...result];
    }

    async createFolder(folderPath, isPrivate = false) {
        this.#checkInitialized();

        folderPath = await this.createPath(folderPath);

        if (isPrivate) {
            await fs.mkdir(path.join(this.privateBaseDir, ...folderPath), { recursive: true });
        } else {
            await fs.mkdir(path.join(this.publicBaseDir, ...folderPath), { recursive: true });
        }
        return true;
    }

    async renameFile(fileId, newName, userId, userIsAdmin = false) {
        this.#checkInitialized();
        const file = await this.File.findById(fileId);

        if (!file) {
            throw new Error('File not found');
        }
        if (file.isPrivate && !userIsAdmin) {
            const access = await this.FileAccess.findOne({
                file_id: fileId,
                user_id: userId,
                accessLevel: 'write'
            });
            if (!access) {
                throw new Error('Access denied');
            }
        }

        const baseDir = file.isPrivate ? this.privateBaseDir : this.publicBaseDir;
        const oldPath = path.join(baseDir, ...file.storagePath);
        const oldName = file.hostName;
        newName = `${Date.now()}-${newName}`;

        const result = transaction(async (session) => {
            file.hostName = newName;
            await file.save();
            await fs.rename(path.join(oldPath, oldName), path.join(oldPath, newName));
            return file;
        });

        return result;
    }

    async getFileUrl(fileId, userId, userIsAdmin = false) {
        this.#checkInitialized();

        const file = await this.File.findById(fileId);

        if (!file) {
            throw new Error('File not found');
        }

        const baseDir = file.isPrivate ? this.privateBaseDir : this.publicBaseDir;

        if (file.isPrivate && !userIsAdmin) {
            const access = await this.FileAccess.findOne({
                file_id: fileId,
                user_id: userId,
                accessLevel: { $in: ['read', 'write'] }
            });

            if (!access) {
                throw new Error('Access denied to private file');
            }
        }
        return (baseDir + path.sep + file.storagePath.join(path.sep) + path.sep + file.hostName);
    }

    async getRegexSafePath(inputPath) {
        const normalizedPath = inputPath.replace(/\\/g, '/');
        const regexSafePath = normalizedPath
            .split('/')
            .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join(`[\\\\${!path.sep === '\\' ? '\\\\' : '/'}]`);
        return regexSafePath;
    }

    async renameFolder(oldFolderPath, newFolderPath, isPrivate = false, userId, userIsAdmin = false) {
        this.#checkInitialized();
    
        oldFolderPath = await this.createPath(oldFolderPath);
        newFolderPath = await this.createPath(newFolderPath);
    
        const baseDir = (isPrivate ? this.privateBaseDir : this.publicBaseDir);
    
        const oldFolderFullPath = path.join(baseDir, ...oldFolderPath);
        const newFolderFullPath = path.join(baseDir, ...newFolderPath);
    
        const files = await this.File.find({
            storagePath: { $in: oldFolderPath },
            isPrivate
        });
    
        for (const file of files) {
            if (file.isPrivate && !userIsAdmin) {
                const access = await this.FileAccess.findOne({
                    file_id: file._id,
                    user_id: userId,
                    accessLevel: 'write'
                });
                if (!access) {
                    throw new Error('Access denied');
                }
            }
    
            const newStoragePath = file.storagePath.map((pathSegment, index) => {
                if (index === oldFolderPath.findIndex(folder => folder === pathSegment)) {
                    return newFolderPath[oldFolderPath.findIndex(folder => folder === pathSegment)];
                }
                return pathSegment;
            });
    
            file.storagePath = newStoragePath;
        }
        await fs.rename(oldFolderFullPath, newFolderFullPath);
        await transaction(async (session) => {
            for (const file of files) {
                await file.save();
            }
        });
    }
    

}

module.exports = FileManager;