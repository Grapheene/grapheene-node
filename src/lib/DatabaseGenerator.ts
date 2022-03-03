import {PrismaClient} from "@prisma/client";
import path from 'path';
import {constants as fsConstants, promises as fs} from 'fs';
import {execSync as exec, spawnSync as spawn} from "child_process";
import {prismaExec, prismaStorage} from './shared/Paths'

const {prefix, postfix} = require('../../prisma/schemas/sqlite.prisma');
const dbUri = process.env.DATABASE_URL;

export const DatabaseGenerator = async (options: any) => {
    const setupDb = async (options: any) => {
        const prismaSchema = path.join(prismaStorage, 'schema.prisma');

        // Only remove the prisma schema if it exists
        try {
            await fs.access(prismaSchema, fsConstants.F_OK);
            await fs.unlink(prismaSchema)
        } catch (e) {
            // do nothing
        }

        process.stdout.write('\rSetting up the database...');

        if (options.dbProvider === 'sqlite') {
            const dbPath = path.join(options.dir, 'grapheene.db');
            const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`

            await fs.writeFile(path.join(prismaStorage, 'schema.prisma'), sqlitePrisma);
            await run(`${prismaExec} generate --schema "${prismaSchema}"`);

            try {
                await fs.access(dbPath, fsConstants.F_OK);
                await fs.access(path.join(prismaStorage, 'migrations'), fsConstants.F_OK);
            } catch (e) {
                // DB or migrations don't exist, run them
                await run(`${prismaExec} migrate dev --name init --schema "${prismaSchema}"`);
                await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
            }
        } else if (dbUri.match(/^mongodb/)) {
            await fs.copyFile(path.join(prismaStorage, 'schemas', 'mongo.prisma'), prismaSchema);
            await run(`${prismaExec} generate --schema "${prismaSchema}"`);

        } else if (dbUri.match(/^post/)) {
            await fs.copyFile(path.join(prismaStorage, 'schemas', 'postgres.prisma'), prismaSchema);
            await run(`${prismaExec} generate --schema "${prismaSchema}"`);

            try {
                await fs.access(path.join(prismaStorage, 'migrations'), fsConstants.F_OK);
            } catch (e) {
                // Migrations don't exist, run them
                if (options.db.migrate) {
                    await run(`${prismaExec} migrate dev --name init --schema "${prismaSchema}"`);
                    await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
                }
            }
        }

        let dbReady = false;
        while (!dbReady) {
            try {
                await fs.access(prismaSchema);
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
