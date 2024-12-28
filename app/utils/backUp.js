const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { utcToJalali } = require('./TimeConverter');

const backupFolder = `./app/database/backups/${utcToJalali(new Date()).replace(/[/: ]/g, '-')}`;

const backUpOneDoc = async (modelName) => {
    try {
        const model = mongoose.model(modelName);

        const filePath = path.join(backupFolder, `${modelName}.json`);
        await fs.writeFile(filePath, "[");

        const totalDocs = await model.countDocuments();
        const batchSize = 10;

        for (let skip = 0; skip < totalDocs; skip += batchSize) {
            const docs = await model.find().skip(skip).limit(batchSize).lean();

            const docsWithObjectIdFormat = docs.map(doc => {
                const { _id, ...rest } = doc;
                return { _id: { "$oid": _id.toString() }, ...rest };
            });

            const fileHandle = await fs.open(filePath, 'a');
            const data = docsWithObjectIdFormat.map(doc => JSON.stringify(doc)).join(',\n');

            if (skip + batchSize < totalDocs) {
                await fileHandle.write(data + ',\n');
            } else {
                await fileHandle.write(data);
            }
            await fileHandle.close();
        }

        await fs.appendFile(filePath, "]");
        console.log(`Backing up model: ${modelName}`);
    } catch (error) {
        console.error(`Error backing up model ${modelName}:`, error);
        throw error;
    }
};

exports.backupDatabase = async () => {
    try {
        const modelNames = mongoose.modelNames();
        await fs.mkdir(backupFolder, { recursive: true });

        await Promise.all(modelNames.map(modelName => backUpOneDoc(modelName)));
        console.log('All backups completed successfully.');
    } catch (error) {
        console.error('An error occurred during the backup process:', error);
    }
};