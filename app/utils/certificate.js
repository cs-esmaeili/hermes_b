const Certificate = require("../../app/database/models/Certificate");

exports.createPureCertificate = async (name, creator, score, minScore, imageUrl, fullName, nationalCode, fatherName) => {
    if (score < minScore) {
        return false
    }
    const newCertificate = await Certificate.create({
        name,
        creator,
        score,
        user: {
            image: { url: imageUrl },
            fullName,
            nationalCode,
            fatherName,
        }
    });
    if (newCertificate) {
        return true
    }
    return false
}