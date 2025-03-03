const { mSearchUser } = require('../static/response.json');
const { getBase64 } = require('@plaiceholder/base64');
const { checkUserAccess } = require("../utils/user");
const User = require("../database/models/User");
const { createHash } = require("../utils/token");
const FileManager = require('../class/filemanager');
const { createApproval } = require('../controllers/approval');
const Approval = require('../database/models/Approval');
const Role = require('../database/models/Role');
const fileManager = FileManager.getInstance();
const errorHandler = require("../utils/errorHandler");

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
    } catch (error) {
        errorHandler(res, error, "user", "securityCheck");
    }
}


exports.userInformation = async (req, res, next) => {
    try {
        let { user_id } = req.body;

        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        const permissions = await User.userPermissions(user_id);
        const user = await User.findOne({ _id: user_id }).populate('role_id', '-permissions').populate('approval_id').lean();

        let finalUser = user;
        if (user.approval_id) {
            finalUser = user.approval_id.User;
        }

        res.send({
            permissions,
            information: finalUser
        });
    } catch (error) {
        errorHandler(res, error, "user", "userInformation");
    }
}

exports.userList = async (req, res, next) => {
    try {
        const { page, perPage } = req.body;
        let users = await User.find({ _id: { $ne: req.user._id } })
            .populate('role_id', '-permissions')
            .populate('approval_id')
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();

        const usersCount = await User.countDocuments({});
        res.send({ usersCount, users });
    } catch (error) {
        errorHandler(res, error, "user", "userList");
    }
}

exports.changeAvatar = async (req, res, next) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        let { user_id = req.user._id } = req.body

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


        let orginalUser = await User.findOne({ _id: user_id }).lean();
        const approval = await createApproval("تغییر عکس پروفایل", "User", user_id, orginalUser._id, orginalUser);


        const approvalChanges = await Approval.updateOne(
            { _id: approval._id },
            {
                $set: {
                    'User.data.image': {
                        url: fileUrl,
                        blurHash
                    }
                }
            },
            { new: true }
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            file
        });

    } catch (error) {
        errorHandler(res, error, "user", "changeAvatar");
    }
};


exports.updateUserData = async (req, res, next) => {
    try {

        const { address, fullName, nationalCode, birthday, shebaNumber, cardNumber
            , fatherName, companyName, economicCode, registrationNumber, postalCode
            , ostan, shahr, github, linkedin, telegram, instagram, twitter, biography, iWant
        } = req.body;

        let { user_id, role_id, email, password, userName } = req.body;


        if (!user_id || user_id == "") {
            user_id = req.user._id;
        }

        if (iWant) {
            role_id = (await Role.findOne({ name: iWant }))?._id || role_id;
        }

        const updateData = {
            'User.data.address': address,
            'User.data.fullName': fullName,
            'User.data.nationalCode': nationalCode,
            'User.data.birthday': birthday,
            'User.data.shebaNumber': shebaNumber,
            'User.data.cardNumber': cardNumber,
            'User.data.fatherName': fatherName,
            'User.data.companyName': companyName,
            'User.data.economicCode': economicCode,
            'User.data.registrationNumber': registrationNumber,
            'User.data.postalCode': postalCode,
            'User.data.ostan': ostan,
            'User.data.shahr': shahr,
            'User.data.biography': biography,
            'User.data.github': github,
            'User.data.linkedin': linkedin,
            'User.data.telegram': telegram,
            'User.data.instagram': instagram,
            'User.data.twitter': twitter,
            'User.role_id': role_id,
            'User.email': email,
            'User.userName': userName,
        };

        if (password) {
            const hashPassword = await createHash(password);
            updateData['User.password'] = hashPassword;
        }

        let orginalUser = await User.findOne({ _id: user_id }).lean();
        const approval = await createApproval("تغییر اطلاعات پروفایل", "User", user_id, orginalUser._id, orginalUser);
        const approvalChanges = await Approval.updateOne(
            { _id: approval._id },
            { $set: updateData }
        );


        if (!approvalChanges.acknowledged) {
            throw { message: 'User update failed', statusCode: 400 }
        }

        res.status(201).json({
            message: 'User data update successfully',
            approvalChanges
        });

    } catch (error) {
        errorHandler(res, error, "user", "updateUserData");
    }
};


exports.createUser = async (req, res, next) => {
    try {

        const { address, fullName, nationalCode, birthday, shebaNumber, cardNumber
            , fatherName, companyName, economicCode, registrationNumber, postalCode
            , ostan, shahr, github, linkedin, telegram, instagram, twitter, biography, iWant
        } = req.body;


        let { role_id, email, password, userName } = req.body;

        if (!role_id || role_id == "") {
            throw { message: 'Role ID is required', statusCode: 400 }
        }

        const user = new User({
            data: {
                address,
                fullName,
                nationalCode,
                birthday,
                shebaNumber,
                cardNumber,
                fatherName,
                companyName,
                economicCode,
                registrationNumber,
                postalCode,
                ostan,
                shahr,
                biography,
                github,
                linkedin,
                telegram,
                instagram,
                twitter,
                iWant
            },
            role_id,
            email,
            password,
            userName
        });

        const savedUser = await user.save();

        if (!savedUser) {
            throw { message: 'User creation failed', statusCode: 400 }
        }

        res.status(201).json({
            message: 'User created successfully',
            user: savedUser
        });

    } catch (error) {
        errorHandler(res, error, "user", "createUser");
    }
};




