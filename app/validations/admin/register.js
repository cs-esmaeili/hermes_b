const Yup = require("yup");

exports.registerSchema  = Yup.object().shape({
    userName: Yup.string("Phone Number")
        .required()
        .test('test-name', "userName is wrong !",
            function (value) {
                const phoneRegex = /(0|\+98)?([ ]|-|[()]){0,2}9[1|2|3|4]([ ]|-|[()]){0,2}(?:[0-9]([ ]|-|[()]){0,2}){8}/ig;
                let isValidPhone = phoneRegex.test(value);
                if (!isValidPhone || isNaN(value)) {
                    return false;
                }
                return true;
            }),
    passWord: Yup.string()
        .min(4)
        .max(255)
        .required(),
    role_id: Yup.string()
        .required(),
});
