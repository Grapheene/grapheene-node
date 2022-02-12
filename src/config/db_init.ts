import {execSync as exec} from "child_process";

const fs = require('fs-extra');
const path = require('path');


const prismaDir = path.dirname(__dirname).replace(/(dist.*)/, 'prisma')


const run = (command: string) => {
    const buff = exec(command);
    const result = buff.toString();
    const retObj: any = {
        error: null,
        result: null
    }
    if (result.match(/^error/i)) {
        retObj.error = result;
        return retObj
    } else {
        retObj.result = result;
        return retObj
    }

}

if (!fs.existsSync(prismaDir + '/schema.prisma')) {
    if (process.env.DATABASE_URL.match(/^mongodb/)) {
        fs.copyFileSync(prismaDir + '/schemas/mongo.prisma', prismaDir + '/schema.prisma')

        // this.run('prisma migrate deploy --schema ' + prismaDir + '/schema.prisma')
    }

    run('prisma generate')
}

