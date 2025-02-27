const Certificate = require("../../app/database/models/Certificate");
const { jalaliToMiladi, utcToJalali } = require("../utils/TimeConverter");

exports.createPureCertificate = async (
    cert_template_id,
    examSession_id,
    creator,
    score,
    status,
    minScore,
    imageUrl,
    fullName,
    nationalCode,
    fatherName,
    startDate,
    endDate,
    duration
) => {
    if (score < minScore) {
        // return false;
    }

    if (!startDate) {
        const miladiDateStr = jalaliToMiladi(endDate);
        const miladiDate = new Date(miladiDateStr);
        miladiDate.setDate(miladiDate.getDate() - duration);
        startDate = utcToJalali(miladiDate);
    }

    const newCertificate = await Certificate.create({
        cert_template_id,
        examSession_id,
        creator,
        score,
        status,
        startDate,
        endDate,
        user: {
            image: { url: imageUrl },
            fullName,
            nationalCode,
            fatherName,
        }
    });
    if (newCertificate) {
        return newCertificate
    }
    return false
}