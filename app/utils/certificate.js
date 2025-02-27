const Certificate = require("../../app/database/models/Certificate");
const { jalaliToMiladi, utcToJalali } = require("../utils/TimeConverter");

exports.createPureCertificate = async (data, minScore, duration) => {

    let { startDate = null, endDate, score } = data;

    if (minScore != 0 && score < minScore) {
        return false;
    }

    
    if (!startDate && duration) {
        const miladiDateStr = jalaliToMiladi(endDate);
        const miladiDate = new Date(miladiDateStr);
        miladiDate.setDate(miladiDate.getDate() - duration);
        data.startDate = utcToJalali(miladiDate);
    }

    const newCertificate = await Certificate.create(data);

    if (newCertificate) {
        return newCertificate
    }
    return false
}