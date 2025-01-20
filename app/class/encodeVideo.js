const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

exports.encodeFile = async (inputFilePath, outputDir, file_id, code) => {
    try {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputFilePath = path.join(outputDir, `${file_id}.mp4`);

        if (fs.existsSync(outputFilePath)) {
            return outputFilePath;
        }
        const ffmpegCommand = `ffmpeg -i "${inputFilePath}" -movflags use_metadata_tags -metadata code="${code}" -c copy "${outputFilePath}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error: ${stderr}`);
                    return reject(new Error('Error processing video'));
                }
                resolve();
            });
        });

        return outputFilePath;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        throw error;
    }
};
