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

        this.publicBaseDir = path.join(process.cwd(), process.env.PUBLIC_DIR);
        this.privateBaseDir = path.join(process.cwd(), process.env.PRIVATE_DIR);

        this.File = File;
        this.FileAccess = FileAccess;

        // Create storage directories if they don't exist
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
    async saveFile(fileBuffer, options) {
        this.#checkInitialized();
        const {
            uploaderId,
            originalName,
            mimeType,
            isPrivate,
            folderPath = '',
            metadata = {}
        } = options;

        const baseDir = isPrivate ? this.privateBaseDir : this.publicBaseDir;
        const fullFolderPath = path.join(baseDir, folderPath);

        await fs.mkdir(fullFolderPath, { recursive: true });

        const uniqueFileName = `${Date.now()}-${originalName}`;
        const storagePath = path.join(folderPath, uniqueFileName);
        const fullFilePath = path.join(baseDir, storagePath);

        transaction(async () => {
            await fs.writeFile(fullFilePath, fileBuffer);

            const file = await this.File.create([{
                uploader_id: uploaderId,
                originalName,
                storagePath,
                mimeType,
                size: fileBuffer.length,
                isPrivate,
                metadata
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
        const fullFilePath = path.join(baseDir, file.storagePath);

        transaction(async () => {
            await this.File.deleteOne({ _id: fileId });
            if (file.isPrivate) {
                await this.FileAccess.deleteOne({ file_id: fileId });
            }
            await fs.unlink(fullFilePath);
            return true;
        });
    }

    async deleteFolder(folderPath, userId) {
        this.#checkInitialized();
        const files = await this.File.find({
            storagePath: { $regex: `^${folderPath}/` }
        });

        for (const file of files) {
            if (file.isPrivate) {
                const access = await this.FileAccess.findOne({
                    file_id: file._id,
                    'accessList.userId': userId,
                    'accessList.accessLevel': 'write'
                });
                if (!access) {
                    throw new Error(`Access denied for file: ${file.originalName}`);
                }
            }
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            for (const file of files) {
                const baseDir = file.isPrivate ? this.privateBaseDir : this.publicBaseDir;
                const fullFilePath = path.join(baseDir, file.storagePath);
                await fs.unlink(fullFilePath);
            }

            await this.File.deleteMany({
                storagePath: { $regex: `^${folderPath}/` }
            }, { session });

            const fileIds = files.map(file => file._id);
            await this.FileAccess.deleteMany({
                file_id: { $in: fileIds }
            }, { session });

            await fs.rmdir(path.join(this.publicBaseDir, folderPath), { recursive: true });
            await fs.rmdir(path.join(this.privateBaseDir, folderPath), { recursive: true });

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async folderFileList(folderPath, userId) {
        this.#checkInitialized();
        const files = await this.File.find({
            storagePath: { $regex: `^${folderPath}/` }
        });

        const result = [];
        for (const file of files) {
            if (!file.isPrivate) {
                result.push(file);
            } else {
                const access = await this.FileAccess.findOne({
                    file_id: file._id,
                    'accessList.userId': userId
                });
                if (access) {
                    result.push({
                        ...file.toObject(),
                        accessLevel: access.accessList.find(a =>
                            a.userId.toString() === userId.toString()
                        ).accessLevel
                    });
                }
            }
        }

        return result;
    }

    async createFolder(folderPath, isPrivate = false) {
        this.#checkInitialized();
        if (isPrivate) {
            await fs.mkdir(path.join(this.privateBaseDir, folderPath), { recursive: true });
        } else {
            await fs.mkdir(path.join(this.publicBaseDir, folderPath), { recursive: true });
        }
        return true;
    }

    async rename(fileId, newName, userId, userIsAdmin = false) {
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
        const oldPath = path.join(baseDir, file.storagePath);
        const folderPath = path.dirname(file.storagePath);
        const newStoragePath = path.join(folderPath, `${Date.now()}-${newName}`);
        const newFullPath = path.join(baseDir, newStoragePath);

        const result = transaction(async () => {
            file.originalName = newName;
            file.storagePath = newStoragePath;
            await file.save();
            await fs.rename(oldPath, newFullPath);
            return file;
        });
        return result;
    }
}

module.exports = FileManager;