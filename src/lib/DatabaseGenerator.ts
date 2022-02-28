import {PrismaClient} from "@prisma/client";
import path from 'path';
import {constants as fsConstants, promises as fs} from 'fs';
import {execSync as exec, spawnSync as spawn} from "child_process";

const {prefix, postfix} = require('../../prisma/schemas/sqlite.prisma');
const dbUri = process.env.DATABASE_URL;
const node_modules = `${__dirname}${path.sep}..${path.sep}..${path.sep}node_modules`;
const sep = path.sep;

export const DatabaseGenerator = async (options: any) => {
    const setupDb = async (options: any) => {
        const prismaDir = path.dirname(__dirname).replace(/(dist.*)/, 'prisma')
        const prismaSchema = `${prismaDir}/schema.prisma`;

        // Only remove the prisma schema if it exists
        try {
            await fs.access(prismaSchema, fsConstants.F_OK);
            await fs.unlink(`${prismaDir}/schema.prisma`)
        } catch (e) {
            // do nothing
        }

        process.stdout.write('\rSetting up the database...');

        if (options.dbProvider === 'sqlite') {
            const dbPath = `${options.dir}/grapheene.db`;
            const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`

            await fs.writeFile(`${prismaDir}/schema.prisma`, sqlitePrisma);
            await run(`${node_modules}${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);
            // await run(`${__dirname}${sep}..${sep}..${sep}node_modules${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);

            try {
                await fs.access(dbPath, fsConstants.F_OK);
                await fs.access(`${prismaDir}/migrations`, fsConstants.F_OK);
            } catch (e) {
                // DB or migrations don't exist, run them
                await run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate dev --name init --schema "${prismaDir}/schema.prisma"`);
                await run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate deploy --schema "${prismaDir}/schema.prisma"`);
            }

        } else if (dbUri.match(/^mongodb/)) {
            await fs.copyFile(`${prismaDir}/schemas/mongo.prisma`, `${prismaDir}/schema.prisma`);
            await run('prisma generate')

        } else if (dbUri.match(/^post/)) {
            await fs.copyFile(`${prismaDir}/schemas/postgres.prisma`, `${prismaDir}/schema.prisma`);
            await run('prisma generate --schema ' + prismaDir + '/schema.prisma');

            try {
                await fs.access(`${prismaDir}/migrations`, fsConstants.F_OK);
            } catch (e) {
                // Migrations don't exist, run them
                if (options.db.migrate) {
                    await run('prisma migrate dev --name init --schema ' + prismaDir + '/schema.prisma');
                    await run('prisma migrate deploy --schema ' + prismaDir + '/schema.prisma');
                }
            }
        }

        let dbReady = false;
        while (!dbReady) {
            try {
                await fs.access(`${node_modules}${sep}.prisma${sep}client${sep}schema.prisma`);
                dbReady = true;
            } catch (e) {
                // do nothing
            }
        }
        process.stdout.write('done!\n');

        return new PrismaClient();
    }

    const run = async (command: string, interactive?: boolean) => {
        let buff;
        if (!interactive) {
            buff = exec(command);
        } else {
            buff = spawn(command);
        }


        const result = buff.toString();
        const retObj: any = {
            error: null,
            result: null
        }
        if (result.match(/^error/i)) {
            retObj.error = result;
            console.error(`Unable to run ${command}:`, retObj.error);
            return retObj
        } else {
            retObj.result = result;
            return retObj
        }
    }

    let db: PrismaClient;
    if (dbUri) {
        console.log('Custom DB URI provided')
        db = await setupDb(options);
    } else {
        console.log('No DB URI provided, using a default SQLite local db')
        db = await setupDb({...options, dbProvider: 'sqlite'})
    }
    return db;
};
