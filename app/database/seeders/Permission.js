const seqNumber = 1;

const seed = async (app, passRoutes) => {
    try {
        for (const key in permissions) {
            const { name, disc } = permissions[key];
            await Permission.create({
                name,
                route: key,
                disc
            });
        }

        const availableRoutes = expressListEndpoints(app);

        for (let i = 0; i < availableRoutes.length; i++) {
            const { path } = availableRoutes[i];
            const result = await Permission.findOne({ route: path });

            if (!passRoutes.includes(path)) {
                console.log(blue(path + " || is Not in the Permission List"));
            }

            if (!result) {
                console.log(blue(path + " || is Not in the Permission List"));
            }
        }

        await console.log(`${red(seqNumber)} : ${green('Permission seed done')}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    seqNumber,
    seed
}
