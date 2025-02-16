const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { green, red } = require('colors');

const seqNumber = 2;
const seed = async () => {

    const permissions = await Permission.find({});

    let permissionIds = [];
    for (const key in permissions) {
        const id = permissions[key]._id;
        permissionIds.push(id);
    }

    await Role.create({ name: 'Admin', permissions: permissionIds });
    await Role.create({ name: 'User', permissions: permissionIds });
    // await Role.create({ name: 'User', permissions: [permissionIds[0], permissionIds[1]] });

    await console.log(`${red(seqNumber)} : ${green('Role seed done')}`);
}

module.exports = {
    seqNumber,
    seed
}