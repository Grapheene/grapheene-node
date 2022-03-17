import path from 'path';
import {constants as fsConstants, promises as fs} from 'fs';
import {execSync as exec, spawnSync as spawn} from "child_process";
import {prismaClient, prismaExec, prismaStorage} from './shared/Paths'

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
            try {
                if (options.dbProvider === 'sqlite') {
                    const dbPath = path.join(options.dir, 'grapheene.db');
                    const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`

                    await fs.writeFile(path.join(prismaStorage, 'schema.prisma'), sqlitePrisma);
                    await run(`${prismaExec} generate --schema "${prismaSchema}"`);
                    await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
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
                            await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
                        }
                    }
                }

                let dbReady = false;
                while (!dbReady) {
                    try {
                        await fs.access(path.join(prismaClient, 'schema.prisma'))
                        dbReady = true;
                    } catch (e) {
                        // do nothing
                    }
                }

                // NOTE: this require has to be here to prevent using the cached unusable Prisma client
                const {PrismaClient} = require('@prisma/client');
                process.stdout.write('done!\n');
                return new PrismaClient();
            } catch
                (e) {
                console.log(e.message)
            }
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

        let db: any;
        if (dbUri) {
            console.log('Custom DATABASE_URL provided')
            db = await setupDb(options);
        } else {
            console.log('No custom DATABASE_URL provided, using a default SQLite local db')
            console.log('    Set DATABASE_URL env if you want to use your own PostgreSQL db')
            db = await setupDb({...options, dbProvider: 'sqlite'})
        }
        return db;
    }
;
