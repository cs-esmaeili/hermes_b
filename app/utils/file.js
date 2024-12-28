const path = require('path');
const fs = require('fs');
const sizeOf = require('image-size');
const { getBase64 } = require('@plaiceholder/base64');
const BaseFileDir = path.join(process.cwd(), ...JSON.parse(process.env.STORAGE_LOCATION));


exports.getImageBlurHash = async (imagePath) => {
    const hash = await getBase64(BaseFileDir + path.sep + imagePath);
    return hash;
}

const isImage = (filePath) => {
    if (!fs.existsSync(filePath)) {
        return false;
    }
    const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']);
    return imageExtensions.has(path.extname(filePath).toLowerCase());
};

const isVideo = (fileName) => {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return videoExtensions.includes(extension);
};

exports.getFilesFromFolder = async (folderPath) => {
    const contents = fs.readdirSync(folderPath);
    let files = [];

    for (const element of contents) {
        const filePath = path.join(folderPath, element);
        const fileStat = fs.statSync(filePath);


        if (fileStat.isFile()) {
            if (isImage(filePath)) {
                const hash = await getBase64(filePath);
                const dimensions = sizeOf(filePath);
                files.push({ type: "image", name: element, size: dimensions, blurHash: hash });
            } else if (isVideo) {
                files.push({ type: "video", name: element });
            } else {
                files.push({ type: "file", name: element });
            }
        } else if (fileStat.isDirectory()) {
            files.push({ type: "folder", name: element });
        }
    }
    return files;
};

exports.getLocalPathFromUrl = (url) => {
    try {
        let localPath = url.replace(process.env.BASE_URL
            + JSON.parse(process.env.STORAGE_LOCATION)[2] + "/", "").split('/');
        localPath = path.join(localPath.join(path.sep));
        localPath = BaseFileDir + path.sep + localPath;
        return localPath;
    } catch (error) {
        console.log(error);
    }

}