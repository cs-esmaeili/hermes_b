const path = require('path');
const { getBase64 } = require('@plaiceholder/base64');
const BaseFileDir = path.join(process.cwd(), ...JSON.parse(process.env.PUBLIC_DIR));


exports.getImageBlurHash = async (imagePath) => {
    const hash = await getBase64(BaseFileDir + path.sep + imagePath);
    return hash;
}