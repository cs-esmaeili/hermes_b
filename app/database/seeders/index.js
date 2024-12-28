const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
let seeders = [];
const seed = async (app) => {
  if (process.argv.includes('fresh')) {
    await fs
      .readdirSync(__dirname)
      .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
      })
      .forEach(file => {
        const seeder = require(path.join(__dirname, file));
        seeders.push(seeder);
      });
    seeders = seeders.sort((a, b) => (a.seqNumber > b.seqNumber) ? 1 : ((b.seqNumber > a.seqNumber) ? -1 : 0));
    for (i = 0; i < seeders.length; i++) {
      await seeders[i].seed(app);
    }
  }
}

module.exports = seed;