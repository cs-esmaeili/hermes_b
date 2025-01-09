const path = require('path');

const fileManagerConfig = {
    publicBaseDir: path.join(process.cwd(), 'public/files'),
    privateBaseDir: path.join(process.cwd(), 'private/files')
};

module.exports = fileManagerConfig;