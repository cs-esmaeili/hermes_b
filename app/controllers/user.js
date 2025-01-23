const { mSearchUser } = require('../static/response.json');
const { getBase64 } = require('@plaiceholder/base64');
const { checkUserAccess } = require("../utils/user");
const FileManager = require('../class/filemanager');
const User = require("../database/models/User");
const { log } = require('node:console');
const fileManager = FileManager.getInstance();

exports.securityCheck = async (req, res, next) => {
    try {
        const { route } = await req.body;
        const check = await checkUserAccess(req.token, route);
        if (!check) {
            throw { message: 'Access denied: Insufficient permissions', statusCode: 403 };
        }

        const permissions = await User.userPermissions(req.user._id);
        const user = await User.findOne({ _id: req.user._id }).populate('role_id', '-permissions').lean();

        res.json({
            information: user,
            permissions,
        });
    } catch (err) {
        console.log(err);
        res.status(422).json({ message: mSearchUser.fail });
    }
}


exports.userInformation = async (req, res, next) => {
    try {
        let { user_id } = req.body;

        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        const permissions = await User.userPermissions(user_id);
        const user = await User.findOne({ _id: user_id }).populate('role_id', '-permissions').lean();
        res.send({
            permissions,
            information: user
        });
    } catch (err) {
        console.log(err);
    }
}

exports.userList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let users = await User.find({}).populate('role_id', '-permissions').skip((page - 1) * perPage).limit(perPage).lean();
        const usersCount = await User.countDocuments({});
        res.send({ usersCount, users });
    } catch (err) {
        res.status(err.statusCode || 422).json(err.errors || err.message);
    }
}

exports.changeAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }
        let { user_id } = req.body;

        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        const file = await fileManager.saveFile(req.file.buffer, {
            uploaderId: user_id,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            isPrivate: false,
            folderPath: JSON.stringify(["", "users", user_id]),
        });


        const fileUrl = await fileManager.getPublicFileUrl(file[0]._id);
        const filePath = await fileManager.getFilePath(file[0]._id, user_id, false);
        const blurHash = await getBase64(filePath);

        const user = await User.updateOne(
            { _id: user_id },
            {
                $set: {
                    'data.image': {
                        url: fileUrl,
                        blurHash
                    }
                }
            }
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            file
        });

    } catch (error) {
        console.log("Error in Change Avatar : " + error);
    }
};


exports.updateUserData = async (req, res, next) => {
    try {

        const { address, fullName, nationalCode, birthday, shebaNumber, cardNumber
            , fatherName, companyName, economicCode, registrationNumber, postalCode
            , ostan, shahr, github, linkedin, telegram, instagram, twitter, biography
        } = req.body;

        let { user_id, role_id } = req.body;

        console.log(role_id);

        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        const user = await User.updateOne(
            { _id: user_id },
            {
                $set: {
                    'data.address': address,
                    'data.fullName': fullName,
                    'data.nationalCode': nationalCode,
                    'data.birthday': birthday,
                    'data.shebaNumber': shebaNumber,
                    'data.cardNumber': cardNumber,
                    'data.fatherName': fatherName,
                    'data.companyName': companyName,
                    'data.economicCode': economicCode,
                    'data.registrationNumber': registrationNumber,
                    'data.postalCode': postalCode,
                    'data.ostan': ostan,
                    'data.shahr': shahr,
                    'data.biography': biography,
                    'data.github': github,
                    'data.linkedin': linkedin,
                    'data.telegram': telegram,
                    'data.instagram': instagram,
                    'data.twitter': twitter,
                    'role_id':  role_id,
                }
            }
        );

        if (!user.acknowledged) {
            throw { message: 'User update failed', statusCode: 400 }
        }

        res.status(201).json({
            message: 'User data update successfully',
            user
        });

    } catch (error) {
        console.log("Error in User data update : " + error);
    }
};





