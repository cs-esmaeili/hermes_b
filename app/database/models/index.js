const colors = require('colors');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const mongoose = require('mongoose');
const models = [];

const migration = async () => {
  await fs
    .readdirSync(__dirname)
    .filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file));
      if (model && model.modelName) {
        models.push(model);
      }
    });

  if (process.argv.includes('fresh')) {
    await Promise.all(models.map(async (model) => {
      try {
        await mongoose.model(model.modelName).deleteMany({});
      } catch (error) {
        console.error(colors.red(`Error deleting documents from ${model.modelName}: ${error.message}`));
      }
    }));
    console.log(colors.red(`Documents deleted from all models`));
  }
}

module.exports = migration;
